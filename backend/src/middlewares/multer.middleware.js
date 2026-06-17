import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));  
const UPLOADS_DIR = path.join(__dirname, "../../uploads");  //uploads folder path

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (_req, file, cb) => {
  const allowed = [".pdf", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only PDF and DOCX files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}); 