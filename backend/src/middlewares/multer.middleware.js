import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    const unique = Date.now()
    cb(null, unique + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".docx"]
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error("Only PDF and DOCX allowed"), false)  // reject
  }
}

export const upload = multer({ storage, fileFilter })