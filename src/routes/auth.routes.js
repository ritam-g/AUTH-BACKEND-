import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authController.getMe); // getMe already has protect middleware in array form
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/logout-all", authController.logoutAll);

// Simple email route requested by user
router.post("/email", (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    res.status(200).json({ message: "Email route working successfully", email });
});

export default router;
