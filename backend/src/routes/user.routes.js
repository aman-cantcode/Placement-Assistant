import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  uploadResume,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/me", getCurrentUser);
router.patch("/me", updateProfile);
router.post("/resume", upload.single("resume"), uploadResume);

export default router;