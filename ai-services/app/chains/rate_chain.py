from langchain_core.prompts import ChatPromptTemplate
from app.schemas import RateResult

from app.llm import model, backup_model

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

structured_rate_model = model.with_structured_output(RateResult).with_fallbacks(
    [backup_model.with_structured_output(RateResult)]
)

rate_chain = rate_prompt | structured_rate_model