import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
    
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
        throw new ApiError(400, "Name, email and password are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        throw new ApiError(400, "Please enter a valid email address");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        throw new ApiError(409, "An account with this email already exists");
    }

    const user = await User.create({ 
        name: name.trim(), 
        email, 
        password 
    }); 

    const { accessToken, refreshToken } = await generateTokens(user);

    const safeUser = await User.findById(user._id).select(
        "-password -refreshToken -resetPasswordToken -resetPasswordExpiry"
    );

    return res
        .status(201)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .json(new ApiResponse(201, { user: safeUser, accessToken }, "Account created"));
});

export { registerUser };
