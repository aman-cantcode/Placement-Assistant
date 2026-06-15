import fs from "fs"
import path from "path"
import pdfParse from "pdf-parse"
import mammoth from "mammoth"

const extractText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  const buffer = fs.readFileSync(filePath)

  if (ext === ".pdf") {
    const data = await pdfParse(buffer)
    return data.text
  }

  if (ext === ".docx") {
    const data = await mammoth.extractRawText({ buffer })
    return data.value
  }

  throw new Error("Unsupported file type")
}

export { extractText }