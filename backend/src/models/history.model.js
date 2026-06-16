import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema(
    {
        question: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            default: ""
        },
        rating: {
            type: Number,
            default: null
        },
        feedback: {
            type: String,
            default: ""
        },
    }
);

const historySchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        jdText: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["analyzing", "done", "failed"],
            default: "analyzing",
        },


        // snapshot of the resume used for this analysis, so updating
        // the resume later does not change old results
        resumeSnapshot: {
            fileName: String,
            text: String,
            uploadedAt: Date,
        },

        //filled by ai after analysis
        analysis: {
            atsScore: {
                type: Number,
                default: null
            },
            matchingSkills: {
                type: [String],
                default: []
            },
            requiredSkills: {
                type: [String],
                default: []
            },
            missingSkills: {
                type: [String],
                default: []
            },
        },
        roadmap: { type: String, default: "" },
        questions: { type: [questionSchema], default: [] },
    },
    { timestamps: true }
);

export const History = mongoose.model("History", historySchema);