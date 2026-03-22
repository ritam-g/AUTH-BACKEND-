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

// Route to test email functionality
router.post("/email", authController.sendTestEmail);

router.get("/verify-email", authController.verifyEmail);

export default router;
