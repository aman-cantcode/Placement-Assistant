from langchain_core.prompts import ChatPromptTemplate

from app.llm import model, backup_model
from app.schemas import AnalysisResult


structured_model = model.with_structured_output(AnalysisResult).with_fallbacks(
    [backup_model.with_structured_output(AnalysisResult)]
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an ATS evaluating how well a resume matches a job description."),
    ("human", "RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{jd_text}\n\nAnalyze the match.")
])

chain = prompt | structured_model