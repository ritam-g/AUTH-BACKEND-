import bcrypt from 'bcryptjs';
import userModel from "../model/user.model.js";
import jwt from "jsonwebtoken";
import { protect } from '../middleware/auth.js';


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
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.status(200).json({
        message: "Logged in successfully",
        user: {
            username: user.username,
            email: user.email
        },
        token
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
    res.status(501).json({ message: 'Refresh token not implemented' });
};

export const logout = (req, res) => {
    res.status(501).json({ message: 'Logout not implemented (client-side token delete)' });
};

export const logoutAll = (req, res) => {
    res.status(501).json({ message: 'Logout all not implemented' });
}
