import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken } from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import rateLimit from "express-rate-limit"

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.route("/register").post(
  upload.none(), // Multer middleware to parse multipart/form-data (no files)
  authLimiter,
  registerUser
);

router.route("/login").post(authLimiter, loginUser);
//router.post("/login", loginUser)  can use this syntax too

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh").post(refreshAccessToken);

export default router;