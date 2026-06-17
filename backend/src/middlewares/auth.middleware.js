import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.header("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

    if(!token) {
        throw new ApiError(401, "Unauthorized Request");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
        throw new ApiError(401, "Access token expired or invalid");
    }

    const user = await User.findById(decoded._id).select(
        "-password -refreshToken -resetPasswordToken -resetPasswordExpiry -resume.text"
    );
    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user; //binds the user to the request object
    next();
});