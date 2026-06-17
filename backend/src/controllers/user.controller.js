import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { extractTextFromFile } from "../utils/extractText.js";

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(
        "-password -refreshToken -resetPasswordToken -resetPasswordExpiry -resume.text"
    );

    return res.status(200).json(new ApiResponse(
        200,
        user,
        "Current user details"
    ));
});

const updateProfile = asyncHandler(async (req, res) => {
    const { name, skills, branch, cgpa, targetCompanies } = req.body;
    name = name?.trim();
    branch = branch?.trim().toUpperCase();

    const updates = {};
    if (name) updates.name = name;
    if (Array.isArray(skills)) updates.skills = skills;
    if (branch) updates.branch = branch;
    if (cgpa !== undefined && cgpa !== null && cgpa !== "") {
        const value = Number(cgpa);
        if (Number.isNaN(value) || value < 0 || value > 10) {
            throw new ApiError(400, "CGPA must be a number between 0 and 10");
        }
        updates.cgpa = value;
    }
    if (Array.isArray(targetCompanies)) updates.targetCompanies = targetCompanies;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true }
    ).select(
        "-password -refreshToken -resetPasswordToken -resetPasswordExpiry -resume.text"
    );

    return res.status(200).json(new ApiResponse(
        200,
        user,
        "Profile updated successfully"
    ));

});

const uploadResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Resume file is required");
    }

    let text;
    try {
        text = await extractText(req.file.path);
    } catch {
        throw new ApiError(400, "Could not read the file, please upload a valid PDF or DOCX");
    } finally {
        fs.unlink(req.file.path, () => { });
    }

    if (!text?.trim()) {
        throw new ApiError(400, "Could not find any text in the file");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                resume: {
                    fileName: req.file.originalname,
                    text,
                    uploadedAt: new Date(),
                },
            },
        },
        { new: true }
    ).select("resume.fileName resume.uploadedAt");

    return res
        .status(200)
        .json(new ApiResponse(200, { resume: user.resume }, "Resume uploaded"));
});

export { 
    getCurrentUser, 
    updateProfile, 
    uploadResume 
};