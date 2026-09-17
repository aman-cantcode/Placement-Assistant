from langchain_core.prompts import ChatPromptTemplate
from app.schemas import RateResult

from app.llm import structured_model

rate_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an experienced technical interviewer rating a candidate's answer.",
    ),
    (
        "human",
        """
        QUESTION:
        {question}

        CANDIDATE'S ANSWER:
        {answer}

        Rate this answer.
        """,
    ),
])


rate_chain = rate_prompt | structured_model(RateResult)