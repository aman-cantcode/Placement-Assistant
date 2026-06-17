import { History } from "../models/history.model.js";
import { Chat } from "../models/chat.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { chatWithAI } from "../utils/aiService.js";

const sendMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message?.trim()) {
        throw new ApiError(400, "Message cannot be empty");
    }

    const history = await History.findOne({
        _id: req.params.historyId,
        owner: req.user._id,
    });
    if (!history) {
        throw new ApiError(404, "History not found");
    }
    if (history.status !== "done") {
        throw new ApiError(400, "Wait for the analysis to finish before chatting");
    }

    let chat = await Chat.findOne({ history: history._id });
    if (!chat) {
        chat = await Chat.create({
            history: history._id,
            owner: req.user._id,
            messages: [],
        });
    }

    const recentMessages = chat.messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
    }));

    const result = await chatWithAI(
        history.resumeSnapshot.text,
        history.jdText,
        recentMessages,
        message.trim()
    );

    // result.reply comes from fastAPI response
    chat.messages.push({ role: "user", content: message.trim() });
    chat.messages.push({ role: "assistant", content: result.reply });
    await chat.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { reply: result.reply }, "Reply generated"));
});

const getMessages = asyncHandler(async (req, res) => {
    const history = await History.findOne({
        _id: req.params.historyId,
        owner: req.user._id,
    }).select("_id");
    if (!history) {
        throw new ApiError(404, "History not found");
    }

    const chat = await Chat.findOne({ history: history._id });

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            { messages: chat?.messages || [] }, 
            "Chat fetched"
        ));
});

export { sendMessage, getMessages };