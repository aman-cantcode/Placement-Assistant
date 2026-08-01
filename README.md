# Placement Assistant

An AI-powered placement preparation platform. Upload your resume, paste any job description, and get an ATS match score, a personalized learning roadmap, mock interview practice with AI feedback, and a chat assistant that actually knows your resume and target job — all grounded in a curated, verified dataset rather than a model just generating plausible-sounding answers.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?logo=langchain&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [License](#license)

---

## Overview

Placement Assistant runs on two independent servers. A Node.js/Express backend owns authentication, user data, and persistence. A separate Python service, built on LangChain, owns all AI orchestration — prompt chains, structured output validation, and a retrieval-augmented generation (RAG) pipeline that grounds the roadmap and interview-question features in a real, curated dataset instead of letting the model invent resource links or generic questions from scratch.

## Features

- **Authentication** — JWT access + refresh tokens with rotation and theft detection, httpOnly cookies, email-based password reset
- **Resume upload** — PDF/DOCX parsing with automatic text extraction
- **ATS analysis** — resume-to-JD match scoring with required/matching/missing skill breakdown, returned as validated structured output
- **Grounded learning roadmap** — week-by-week plan built only from a curated, link-verified resource dataset via RAG, not invented URLs
- **Mock interview practice** — questions retrieved from a real curated question bank and personalized to the candidate, then AI-rated answers with actionable feedback
- **Context-aware chat** — grounded in the candidate's actual resume and job description
- **Quota limits** on AI endpoints to control usage per user

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Multer, Nodemailer |
| AI Service | Python, FastAPI, LangChain (LCEL, structured output, RAG), Google Gemini, ChromaDB |
| Frontend | HTML, CSS, vanilla JavaScript |

## Architecture

```
Browser
   │  HTTP :8080
   ▼
Node.js (Express)  ──────────────  MongoDB
   │  HTTP :8000 (localhost only, shared-secret header)
   ▼
Python (FastAPI + LangChain)  ───  ChromaDB (local, persisted vector store)
   │
   ▼
Google Gemini (chat model + embeddings model)
```

The Python service is never exposed to the internet — it binds to `127.0.0.1` and additionally verifies an `x-internal-key` header shared with the Node.js backend on every request. Node.js's contract with this service (request/response shapes for `/analyze`, `/roadmap`, `/interview/questions`, `/interview/rate`, `/chat`) has stayed fixed even as the AI service's internals were rebuilt from raw SDK calls to LangChain — each side only depends on the HTTP interface, not on the other's implementation.

## Project Structure

```
placement-assistant/
├── backend/
│   ├── public/                    # static frontend (HTML/CSS/JS)
│   └── src/
│       ├── index.js               # entry point — connects MongoDB, then starts Express server
│       ├── app.js                 # Express app + middleware configuration
│       ├── db/                    # MongoDB connection
│       ├── models/                # Mongoose schemas (User, History, Chat, etc.)
│       ├── controllers/           # request handlers (auth, user, history, chat)
│       ├── middlewares/           # auth, multer, error handling, quota, etc.
│       ├── routes/                # Express route definitions
│       └── utils/                 # ApiError, ApiResponse, asyncHandler, AI service client, email utilities
│
└── ai-service/
    ├── main.py                    # FastAPI entry point + global exception handler
    ├── requirements.txt
    ├── data/
    │   ├── learning-resources-dataset.json    # curated learning resources dataset
    │   ├── interview-questions-dataset.json   # curated interview questions dataset
    │   ├── ingest_data.py                     # one-time script to build/update the vector database
    │   └── chroma_db/                         # persisted Chroma vector database (git-ignored)
    │
    └── app/
        ├── config.py              # loads .env once and exposes configuration
        ├── security.py            # internal API key verification
        ├── schemas.py             # Pydantic request/response models
        ├── chains/                # one LangChain chain per AI feature
        └── routers/               # FastAPI route handlers
```

All environment variables for the AI service are loaded once in `app/config.py` and imported from there everywhere else (`security.py`, the chain modules) — nothing else calls `os.getenv()` directly.

## Database Schema

Three MongoDB collections:

| Collection | Purpose |
|---|---|
| **users** | Auth credentials, profile, extracted resume text, refresh token |
| **histories** | One document per JD submission — status, resume snapshot at time of analysis, ATS analysis, roadmap, interview questions |
| **chats** | One-to-one with a history, holds the message thread for that analysis session |

`histories.owner` and `chats.owner` reference `users._id`; `chats.history` references `histories._id`. A history's `resumeSnapshot` is copied at creation time so later resume updates never retroactively change a past analysis.

## Prerequisites

- Node.js 18+
- Python 3.10+
- A MongoDB connection string (MongoDB Atlas or local)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) generated (for password-reset emails)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/aman-cantcode/Placement-Assistant
cd placement-assistant
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env    # fill in the values — see Environment Variables below
npm run dev
```

The backend runs on `http://localhost:8080`.

### 3. AI service setup

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate      # venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env          # fill in the values — see Environment Variables below
```

### 4. Build the vector store (one-time)

Run these once, and again any time the dataset files under `data/` change:
Run at ai-services as module

```bash
python -m data.injest_data
```

This embeds the curated datasets and persists them to `chroma_db/`. The live app only ever reads from this — it never rebuilds the index on startup.

### 5. Run the AI service

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Both servers need to be running for AI features to work — the backend alone is enough for auth and profile management.

## Environment Variables

**`backend/.env`**

| Variable | Description |
|---|---|
| `PORT` | Port for the Express server (e.g. `8080`) |
| `MONGO_URI` | MongoDB connection string |
| `CORS_ORIGIN` | Allowed frontend origin |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (must differ from the above) |
| `ACCESS_TOKEN_EXPIRY` | e.g. `15m` |
| `REFRESH_TOKEN_EXPIRY` | e.g. `7d` |
| `EMAIL_USER` | Gmail address used to send password-reset emails |
| `EMAIL_PASS` | Gmail App Password (not your account password) |
| `FRONTEND_URL` | Base URL used to build password-reset links |
| `INTERNAL_API_KEY` | Shared secret sent to the AI service — must match `ai-service/.env` |

**`ai-service/.env`**

| Variable | Description |
|---|---|
| `GOOGLE_API_KEY` | Gemini API key from Google AI Studio |
| `INTERNAL_API_KEY` | Shared secret verified on every request — must match `backend/.env` |

## API Reference

**Backend — `http://localhost:8080/api/v1`**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create an account |
| POST | `/auth/login` | — | Log in |
| POST | `/auth/logout` | ✓ | Log out, revoke refresh token |
| POST | `/auth/refresh-token` | cookie | Get a new access token |
| POST | `/auth/forgot-password` | — | Request a password reset email |
| POST | `/auth/reset-password` | — | Reset password with emailed token |
| GET | `/users/me` | ✓ | Get current user |
| PATCH | `/users/profile` | ✓ | Update profile fields |
| POST | `/users/resume` | ✓ | Upload resume (PDF/DOCX) |
| POST | `/histories` | ✓ | Submit a JD, start analysis |
| GET | `/histories` | ✓ | List all past analyses |
| GET | `/histories/:id` | ✓ | Get one analysis in full |
| DELETE | `/histories/:id` | ✓ | Delete an analysis |
| POST | `/histories/:id/roadmap` | ✓ | Generate the learning roadmap |
| POST | `/histories/:id/questions` | ✓ | Generate interview questions |
| POST | `/histories/:id/answers` | ✓ | Submit answers for rating |
| GET | `/histories/:id/chat` | ✓ | Get chat messages |
| POST | `/histories/:id/chat` | ✓ | Send a chat message |

**AI Service — `http://127.0.0.1:8000`** (internal only, requires `x-internal-key` header)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/analyze` | ATS score + skill match, structured output |
| POST | `/roadmap` | RAG-grounded learning roadmap |
| POST | `/interview/questions` | RAG-grounded, personalized interview questions |
| POST | `/interview/rate` | Rate one interview answer |
| POST | `/chat` | Context-aware chat reply |


## License

MIT
