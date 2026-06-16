import { Router } from "express";
import {
  createHistory,
  getHistories,
  getHistoryById,
  deleteHistory,
  createRoadmap,
  createQuestions,
  submitAnswers,
} from "../controllers/history.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkQuota } from "../middlewares/quota.middleware.js";
import chatRouter from "./chat.routes.js";

const router = Router();

router.use(verifyJWT); // everything below needs a logged in user

router.post("/", checkQuota("history"), createHistory);
router.get("/", getHistories);
router.get("/:historyId", getHistoryById);
router.delete("/:historyId", deleteHistory);

router.post("/:historyId/roadmap", createRoadmap);
router.post("/:historyId/questions", createQuestions);
router.post("/:historyId/answers", submitAnswers);

// chat lives under a history: /api/v1/histories/:historyId/chat
router.use("/:historyId/chat", chatRouter);

export default router;