from app.config import *

from typing import List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from app.schemas import AnalysisResult


model = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

structured_model = model.with_structured_output(AnalysisResult)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an ATS evaluating how well a resume matches a job description."),
    ("human", "RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{jd_text}\n\nAnalyze the match.")
])

chain = prompt | structured_model
