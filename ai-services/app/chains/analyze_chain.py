from langchain_core.prompts import ChatPromptTemplate

from app.llm import structured_model
from app.schemas import AnalysisResult


prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an ATS evaluating how well a resume matches a job description."),
    ("human", "RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{jd_text}\n\nAnalyze the match.")
])

chain = prompt | structured_model(AnalysisResult)