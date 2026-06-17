import { Router } from "express";
import { sendMessage, getMessages } from "../controllers/chat.controller.js";
import { checkQuota } from "../middlewares/quota.middleware.js";

// mergeParams gives us access to :historyId from the parent router(history.routes.js)
const router = Router({ mergeParams: true });

router.post("/", checkQuota("chat"), sendMessage);
router.get("/", getMessages);

export default router;