import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";


const refreshCookieOptions = {
    httpOnly: true, //only browser and server can modify cookies, js can't (prevents xss)
    secure: process.env.NODE_ENV === "production",   //https in production
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};


const generateTokens = async (user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //now during save mongoose wont ask for required feilds (like pass)

    return { accessToken, refreshToken };
}

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
        .json(new ApiResponse(
            201,
            {
                user: safeUser,
                accessToken
            },
            "Account created"
        ));
});

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if (!email?.trim() || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({
        //$or: [{ username }, { email }]
        email: email.trim().toLowerCase()
    });

    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(400, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    const safeUser = await User.findById(user._id).select(
        "-password -refreshToken -resetPasswordToken -resetPasswordExpiry -resume.text"
    );

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .json(new ApiResponse(
            200,
            {
                user: safeUser,
                accessToken
            },
            "User logged in"
        ));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        }
    );

    return res
        .status(200)
        .clearCookie("refreshToken", clearCookieOptions)
        .json(new ApiResponse(200, {}, "Logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingToken = req.cookies?.refreshToken; //sent by browser(httpOnly)

    if (!incomingToken) {
        throw new ApiError(401, "No refresh token");
    }

    let decoded;
    try {
        decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
    } catch {
        throw new ApiError(401, "Refresh token expired or invalid");
    }

    const user = await User.findById(decoded._id);
    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    // Theft detection: the token is valid but it is not the one we stored,
    // which means an old (rotated-out) token is being reused.
    if (user.refreshToken !== incomingToken) {
        user.refreshToken = undefined; //log user out for safety
        await user.save({ validateBeforeSave: false });
        throw new ApiError(401, "Refresh token reuse detected, please log in again");
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken

};
