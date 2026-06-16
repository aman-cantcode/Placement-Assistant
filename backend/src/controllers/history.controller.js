import { History } from "../models/history.model.js";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    analyzeResume,
    generateRoadmap,
    generateQuestions,
    rateAnswers,
} from "../utils/aiService.js";

// Runs in the background after the response has already been sent.
const runAnalysis = async (historyId) => {
    try {
        const history = await History.findById(historyId);
        const result = await analyzeResume(history.resumeSnapshot.text, history.jdText);

        history.analysis = {
            atsScore: result.ats_score,
            matchingSkills: result.matching_skills,
            requiredSkills: result.required_skills,
            missingSkills: result.missing_skills,
        };
        history.status = "done";
        await history.save();
    } catch (error) {
        console.error("Analysis failed for history", historyId, error);
        await History.findByIdAndUpdate(historyId, { status: "failed" });
    }
};

const createHistory = asyncHandler(async (req, res) => {
    const { title, jdText } = req.body;

    if (!jdText?.trim()) {
        throw new ApiError(400, "Job description is required");
    }

    const userWithResume = await User.findById(req.user._id).select("resume");
    if (!userWithResume?.resume?.text) {
        throw new ApiError(400, "Please upload your resume first");
    }

    const history = await History.create({
        owner: req.user._id,
        title: title?.trim() || "Untitled Analysis",
        jdText: jdText.trim(),
        status: "analyzing",
        resumeSnapshot: {
            fileName: userWithResume.resume.fileName,
            text: userWithResume.resume.text,
            uploadedAt: userWithResume.resume.uploadedAt,
        },
    });

    // fire and forget: respond now, the AI works in the background
    runAnalysis(history._id);

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            {
                _id: history._id,
                status: history.status
            },
            "Analysis started"
        ));
});

const getHistories = asyncHandler(async (req, res) => {
    const histories = await History.find({ owner: req.user._id })
        .select("title status analysis.atsScore createdAt") // jdText: large
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, histories, "Histories fetched"));
});

const getHistoryById = asyncHandler(async (req, res) => {
    const history = await History.findOne({
        _id: req.params.historyId,
        owner: req.user._id,  //if only filter by _id, any logged-in user could access another user's history by guessing the ID
    }).select("-resumeSnapshot.text");

    if (!history) {
        throw new ApiError(404, "History not found");
    }

    return res.status(200).json(new ApiResponse(200, history, "History fetched"));
});

const deleteHistory = asyncHandler(async (req, res) => {
    const history = await History.findOneAndDelete({
        _id: req.params.historyId,
        owner: req.user._id,
    });

    if (!history) {
        throw new ApiError(404, "History not found");
    }

    await Chat.deleteOne({ history: history._id });

    return res.status(200).json(new ApiResponse(200, {}, "History deleted"));
});

// helper used by the AI feature endpoints below
// Verify user ownership and completed analysis 
const getOwnedDoneHistory = async (historyId, userId) => {
    const history = await History.findOne({ _id: historyId, owner: userId });
    if (!history) {
        throw new ApiError(404, "History not found");
    }
    if (history.status !== "done") {
        throw new ApiError(400, "Wait for the analysis to finish first");
    }
    return history;
};

const createRoadmap = asyncHandler(async (req, res) => {
    const history = await getOwnedDoneHistory(req.params.historyId, req.user._id);

    if (history.roadmap) {
        return res
            .status(200)
            .json(new ApiResponse(
                200, 
                { roadmap: history.roadmap }, 
                "Roadmap fetched"
            ));
    }

    const result = await generateRoadmap(
        history.resumeSnapshot.text,
        history.jdText,
        history.analysis.missingSkills
    );

    history.roadmap = result.roadmap;
    await history.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { roadmap: history.roadmap }, "Roadmap generated"));
});

const createQuestions = asyncHandler(async (req, res) => {
    const history = await getOwnedDoneHistory(req.params.historyId, req.user._id);

    if (history.questions.length > 0) {
        return res
            .status(200)
            .json(new ApiResponse(
                200, 
                { questions: history.questions }, 
                "Questions fetched"
            ));
    }

    const result = await generateQuestions(history.jdText);
    history.questions = result.questions.map((q) => ({ question: q }));
    await history.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { questions: history.questions }, "Questions generated"));
});

const submitAnswers = asyncHandler(async (req, res) => {
    const { answers } = req.body;
    const history = await getOwnedDoneHistory(req.params.historyId, req.user._id);

    if (history.questions.length === 0) {
        throw new ApiError(400, "Generate the questions first");
    }
    if (!Array.isArray(answers) || answers.length !== history.questions.length) {
        throw new ApiError(400, "Please answer every question");
    }

    const items = history.questions.map((q, i) => ({
        question: q.question,
        answer: String(answers[i] || "").trim(),
    }));

    const result = await rateAnswers(history.jdText, items);

    history.questions.forEach((q, i) => {
        q.answer = items[i].answer;
        q.rating = result.ratings[i]?.rating ?? null;
        q.feedback = result.ratings[i]?.feedback ?? "";
    });
    await history.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { questions: history.questions }, "Answers rated"));
});

export {
    createHistory,
    getHistories,
    getHistoryById,
    deleteHistory,
    createRoadmap,
    createQuestions,
    submitAnswers,
};