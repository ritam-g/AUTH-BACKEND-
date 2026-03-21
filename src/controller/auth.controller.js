import bcrypt from 'bcryptjs';
import userModel from "../model/user.model.js";
import jwt from "jsonwebtoken";
import { protect } from '../middleware/auth.js';
import "dotenv/config"
import sessionModel from '../model/session.model.js';
import crypto from 'crypto';

/**
 * AUTH CONTROLLER
 * ----------------
 * This controller handles User Registration, Login, Session Management, 
 * and multi-device Logout functionality.
 * 
 * Strategy:
 * 1. Access Token: Short-lived (15m) JWT sent in JSON response. Used for API authorization.
 * 2. Refresh Token: Long-lived (7d) JWT stored in an HttpOnly cookie. Used to get new access tokens.
 * 3. Session Tracking: Each refresh token is hashed and stored in the database to allow individual 
 *    session revocation (logout) and security auditing.
 */

/**
 * ✅ REGISTER NEW USER
 * 1. Checks if username or email is already taken.
 * 2. Hashes password using bcrypt.
 * 3. Creates the user in the database.
 * 4. Automatically logs the user in by creating a session and refresh token.
 */
export async function register(req, res) {
    const { username, email, password } = req.body;

    const isAlreadyRegistered = await userModel.findOne({
        $or: [{ username }, { email }]
    });

    if (isAlreadyRegistered) {
        return res.status(409).json({
            message: "Username or email already exists"
        });
    }

    const salt = await bcrypt.genSalt(12); // Higher salt (12) makes brute-force attacks much harder
    // ✅ hash password
    const hashedPassword = await bcrypt.hash(password, salt); // Hashing protects user passwords in case of DB breach

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword // Save hashed password, NEVER the plain text (Security Rule #1)
    });
    // ✅ Create Refresh Token (Long lived - used to keep user logged in across browser restarts)
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    // Hash the refresh token for DB storage (Security: Storing hashes prevents token theft if DB is leaked)
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex'); // Later used in 'refreshToken' function to verify session

    // Create a session in the DB to track this specific device/browser
    const session = await sessionModel.create({
        user: user._id, // Links this session record to the newly registered user
        refreshTokenHash, // Store the HASH, not the raw token (Security measure)
        ip: req.ip, // Store IP to help user identify suspicious logins
        userAgent: req.headers["user-agent"] // Store browser info so user knows which device this is
    })

    // ✅ Create Access Token (Short lived - sent with every API data request)
    const acessToken = jwt.sign(
        { id: user._id, sessionId: session._id }, // Include sessionId to link this token to its DB session entry
        process.env.JWT_SECRET,
        { expiresIn: "15m" } // 15 mins expiry ensures that if stolen, the token is soon useless
    );

    // ✅ Set Refresh Token in an HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // Crucial: Prevents hackers from stealing the token via Javascript (XSS protection)
        secure: true, // Crucial: Ensures token is only sent over encrypted HTTPS connections
        sameSite: "strict", // Crucial: Prevents "Cross-Site Request Forgery" (CSRF) attacks
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (Matches the 'expiresIn' setting used at line 55)
    })

    res.status(201).json({
        message: "User registered successfully",
        user: {
            username: user.username,
            email: user.email
        },
        acessToken
    });
}


/**
 * ✅ LOGIN USER
 * 1. Verifies credentials.
 * 2. Cleans up old revoked sessions for this user.
 * 3. Creates a new session and refresh token.
 * 4. Multi-device support: Does NOT logout other devices unless explicitly requested.
 */
export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    // ✅ Generate Tokens
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    const acessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // 🚀 Maintenance: Automatically delete old 'dead' sessions for this user to keep DB size small
    await sessionModel.deleteMany({ user: user._id, revoked: true });

    // ✅ Create new session record for this login
    await sessionModel.create({
        user: user._id, // Connects session to user
        refreshTokenHash, // Hashed token for DB comparison
        ip: req.ip, 
        userAgent: req.headers["user-agent"] || "unknown" 
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
        message: "Logged in successfully",
        user: {
            username: user.username,
            email: user.email
        },
        acessToken
    });
}


/**
 * ✅ GET CURRENT USER
 * Purpose: Returns the data of the currently logged-in user.
 * Middleware: 'protect' verifies the Access Token in the header.
 */
export const getMe = [protect, async (req, res) => {
    res.status(200).json({
        message: "User fetched successfully",
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        }
    });
}];

/**
 * ✅ REFRESH TOKEN
 * Purpose: Allows the frontend to get a new Access Token without asking for password.
 * Security: Uses 'Refresh Token Rotation'.
 * 1. Reads refresh token from HttpOnly cookie.
 * 2. Hashes it and checks if it exists and is NOT revoked in the DB.
 * 3. If valid, generates a NEW access token and a NEW refresh token.
 * 4. Old refresh token is replaced in the session (rotation).
 */
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token is required"
            });
        }
        
        // Hash the token received from the cookie to look it up in our 'sessions' collection
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex'); 
        
        // Find the active session. If 'revoked' is true, it means the user logged out from elsewhere.
        const session = await sessionModel.findOne({
            refreshTokenHash: refreshTokenHash, // Find the session created in 'register' or 'login' functions
            revoked: false // SECURITY: If this is true, the session was killed (refer to 'logoutAll' function)
        });

        if (!session) {
            return res.status(401).json({
                message: "Invalid or expired refresh token"
            });
        }

        // Verify the JWT is legitimate and hasn't been tampered with
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // ✅ 1. Create a FRESH short-lived access token for the frontend to use
        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" } // Keep it short (Security)
        );

        // ✅ 2. Refresh Token Rotation: We create a NEW refresh token every time it is used
        const newRefreshToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        
        // ✅ 3. Update the existing session record with the NEW token hash
        // This makes the OLD refresh token immediately invalid if reused (detects stolen tokens)
        session.refreshTokenHash = newRefreshTokenHash; 
        await session.save(); // Rotation cycle complete

        // ✅ 4. Set NEW refresh token in cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token"
        });
    }
};

/**
 * ✅ LOGOUT (Single Device)
 * 1. Reads the refresh token hash from current session.
 * 2. Marks ONLY this specific session as 'revoked'.
 * 3. Effectively logs the user out of the current browser only.
 */
export const logout = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Update ONLY this specific session to be invalid
    const session = await sessionModel.findOneAndUpdate(
        { refreshTokenHash }, // Match the unique hash of this device's token
        { revoked: true } // Mark as revoked so 'refreshToken' function will reject it next time
    );
    
    if (!session) {
        return res.status(401).json({ message: 'Session not found or already logged out' });
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * ✅ LOGOUT ALL DEVICES
 * 1. Uses the user ID from the valid refresh token.
 * 2. Marks EVERY session for this user in the DB as 'revoked'.
 * 3. Effect: All browser sessions, mobile logins, etc., for this user will be invalidated.
 */
export const logoutAll = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token is required" });
        }

        // Verify the token to identify which User is making the request
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // ✅ THE "NUCLEAR OPTION": Mark ALL session records for this user as 'revoked'
        // This will force every browser/phone the user is logged into to logout immediately.
        const result = await sessionModel.updateMany(
            { user: decoded.id }, // Find all sessions belonging to this user ID
            { revoked: true } // Kill them all globally
        );

        // Clear the cookie for the current session
        res.clearCookie("refreshToken");

        res.status(200).json({
            message: "Successfully logged out from all devices",
            revokedSessionsCount: result.modifiedCount
        });

    } catch (error) {
        console.error("Logout All Error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
