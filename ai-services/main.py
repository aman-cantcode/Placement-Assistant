from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import *
from app.routers import analyze, roadmap, interview, chat

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "AI service error"})

app.include_router(analyze.router)
app.include_router(roadmap.router)
app.include_router(interview.router)
app.include_router(chat.router)


