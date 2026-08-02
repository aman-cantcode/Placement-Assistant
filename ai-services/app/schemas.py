from typing import List
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    resume_text: str
    jd_text: str


class AnalysisResult(BaseModel):
    ats_score: int = Field(description="ATS match score from 0 to 100")
    required_skills: List[str] = Field(description="Skills required by the job description")
    matching_skills: List[str] = Field(description="Required skills found in the resume")
    missing_skills: List[str] = Field(description="Required skills missing from the resume")


class RoadmapRequest(BaseModel):
    resume_text: str
    jd_text: str
    missing_skills: List[str]


class RoadmapResponse(BaseModel):
    roadmap: str


class QuestionsRequest(BaseModel):
    resume_text: str
    jd_text: str


class QuestionsResponse(BaseModel):
    questions: List[str]


class InterviewItem(BaseModel):
    question: str
    answer: str


class RateRequest(BaseModel):
    jd_text: str
    items: List[InterviewItem]


class RateResult(BaseModel):
    rating: int = Field(
        ge=0,
        le=10,
        description="Score from 0 to 10 rating the quality of the interview answer",
    )
    feedback: str = Field(
        description="2-3 sentences of specific, actionable feedback on the answer",
    )


class RateResponse(BaseModel):
    ratings: List[RateResult]


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    resume_text: str
    jd_text: str
    messages: list[ChatMessage]
    new_message: str


class ChatResponse(BaseModel):
    reply: str