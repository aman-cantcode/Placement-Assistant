import { History } from '../models/history.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { User } from '../models/user.model.js';
import { Chat } from '../models/chat.model.js';


const createHisotry = asyncHandler(async (req, res) => {
    const { title, jdText } = req.body

    if (!jdText) {
        throw new ApiError(400, "Job description is required")
    }

    if (!req.user.resume?.text) {
        throw new ApiError(400, "Please upload resume first")
    }

    const history = await History.create({
        owner: req.user._id,
        title: title || "Untitled Analysis",
        jdText,
        resumeSnapshot: req.user.resume,
        status: "analysing"
    })

    return res.status(201).json(
        new ApiResponse(
            201,
            history,
            "Analysis Started"
        )
    )

    // fire and forget — runs in background AFTER response is sent
    runAnalysis(history._id, req.user.resume.text, jdText)

});
