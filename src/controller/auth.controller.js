import bcrypt from 'bcryptjs';
import userModel from "../model/user.model.js";
import jwt from "jsonwebtoken";
import { protect } from '../middleware/auth.js';
import "dotenv/config"

// ✅ REGISTER
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

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    });

    res.status(201).json({
        message: "User registered successfully",
        user: {
            username: user.username,
            email: user.email
        }
    });
}


// ✅ LOGIN (Only Access Token)
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

    // ✅ Simple JWT (no refresh token)
    // now her will be access token Okay the access cheque on time limit will be 15 minute
    // and the refresh token time limit will be a long day it can be co like a seven day to 15 day as far we can go through it
    const acessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    res.cookie("refreshToken", refreshToken, {
        // httpsONly means client side script can not access this cookie
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        // maxAge means the cookie will expire in 7 days
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


// ✅ GET CURRENT USER (Protected Route)
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

// Stub implementations for missing routes
export const refreshToken = (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token is required"
            });
        }

        // ✅ verify token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_SECRET
        );

        // ✅ create new access token
        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // ✅ create new refresh token (rotation)
        const newRefreshToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ set cookie properly
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,       // use false in localhost
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Token refreshed",
            accessToken
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token"
        });
    }
};

export const logout = (req, res) => {
    res.status(501).json({ message: 'Logout not implemented (client-side token delete)' });
};

export const logoutAll = (req, res) => {
    res.status(501).json({ message: 'Logout all not implemented' });
}
