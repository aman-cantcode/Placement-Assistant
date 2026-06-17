import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, _req, res, _next) => { //_req and _next are required parameters for Express error handlers, even if we don't use them
    if (err instanceof multer.MulterError) {
        const message =
            err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 5 MB)" : err.message;
        return res.status(400).json({ success: false, message });
    }

    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    if (statusCode === 500) {
        console.log(err); // log unexpected errors for debugging
    }

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
    });
};

export { errorHandler };