import axios from "axios";

// Every call to the internal FastAPI service goes through this helper.
// The x-internal-key header is how FastAPI knows the request is from us.
const callAI = async (path, data) => {
    const response = await axios.post(`${process.env.FASTAPI_URL}${path}`, data, {
        headers: { "x-internal-key": process.env.INTERNAL_API_KEY },
        timeout: 120000,
    });
    return response.data;
};

const analyzeResume = (resumeText, jdText) =>
    callAI("/analyze", { resume_text: resumeText, jd_text: jdText });

const generateRoadmap = (resumeText, jdText, missingSkills) =>
    callAI("/roadmap", {
        resume_text: resumeText,
        jd_text: jdText,
        missing_skills: missingSkills,
    });

const generateQuestions = (jdText) =>
    callAI("/interview/questions", { jd_text: jdText });

const rateAnswers = (jdText, items) =>
    callAI("/interview/rate", { jd_text: jdText, items });

const chatWithAI = (resumeText, jdText, recentMessages, message) =>
    callAI("/chat", {
        resume_text: resumeText,
        jd_text: jdText,
        recent_messages: recentMessages,
        message,
    });

export {
    analyzeResume,
    generateRoadmap,
    generateQuestions,
    rateAnswers,
    chatWithAI,
};