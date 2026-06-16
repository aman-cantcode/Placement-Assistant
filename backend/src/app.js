import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true   // needed for cookies (refresh token)
}));

app.use(express.json({ limit:"500kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import historyRouter from "./routes/history.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/histories", historyRouter);



export { app };