from typing import List
from pydantic import BaseModel, Field

class AnalyzeRequest(BaseModel):  #describes what's coming in — the JSON body frm Node.js
    resume_text: str
    jd_text: str

class AnalysisResult(BaseModel):
    ats_score: int = Field(description="ATS match score from 0 to 100")
    required_skills: List[str] = Field(description="Skills required by the job description")
    matching_skills: List[str] = Field(description="Required skills found in the resume")
    missing_skills: List[str] = Field(description="Required skills missing from the resume")