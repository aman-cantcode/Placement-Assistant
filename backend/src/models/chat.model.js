import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },
        content: {
            type: String,
            required: true
        }
    }, {
        timestamps: true
    }
);

const chatSchema = new Schema(
    {
        history: {
            type: Schema.Types.ObjectId,
            ref: "History",
            required: true,
            unique: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    }
)

export const Chat = mongoose.model("Chat", chatSchema);