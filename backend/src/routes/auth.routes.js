import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
  "/register",
  upload.none(), // Multer middleware to parse multipart/form-data (no files)
  registerUser
);

export default router;