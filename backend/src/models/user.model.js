import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true 
        },
        password: { 
            type: String, 
            required: [true, "Password is required"] 
        },
        skills: {
            type: [String],
            default: []
        },
        branch: {
            type: String,
            default: ""
        },
        cgpa: {
            type: Number,
            min: 0,
            max: 10,
            default: null
        },
        targetCompanies: {
            type: [String],
            default: []
        },
        resume: {
            filename: {
                type: String,
            },
            text: {
                type: String,
            },
            uploadedAt: {
                type: Date,
            }
        },

        refreshToken: { type: String },
        resetPasswordToken: { type: String },
        resetPasswordExpiry: { type: Date },
    }, 
    { timestamps: true }
);
            
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 5);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { 
            _id: this._id, 
            email: this.email 
        },
        process.env.JWT_ACCESS_SECRET,
        { 
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
        return jwt.sign(
            { 
                _id: this._id 
            },
            process.env.JWT_REFRESH_SECRET,
            { 
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
}

export const User = mongoose.model("User", userSchema);