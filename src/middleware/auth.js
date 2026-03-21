import jwt from "jsonwebtoken";
import userModel from "../model/user.model.js";

export const protect = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await userModel.findById(decoded.id).select("-password");
        
        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }
        
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};
