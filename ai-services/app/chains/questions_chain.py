from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

from app.llm import structured_model
from app.schemas import QuestionsResponse
from app.retrieval import make_retriever


questions_retriever = make_retriever("interview_questions", k = 8)

def format_questions(docs):
    return "\n".join(f"- [{d.metadata['skill']}] {d.metadata['question']}" for d in docs)

def retrieve_and_format_questions(input_dict):
    docs = questions_retriever.invoke(input_dict["jd_text"])
    return {
        "resume_text": input_dict["resume_text"],
        "jd_text": input_dict["jd_text"],
        "context": format_questions(docs)
    }


questions_prompt =  ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an interview coach. You're given real, curated interview questions from a question bank under QUESTION BANK. Select and lightly personalize the most relevant ones for this specific candidate and job. You may add up to 2 original questions only if something specific in the resume isn't covered by the bank.",
    ),
    (
        "human",
        """
            RESUME:
            {resume_text}

            JOB DESCRIPTION:
            {jd_text}

            QUESTION BANK:
            {context}

            Produce exactly 6 interview questions.
        """,
    ),
])


questions_chain = (
    RunnableLambda(retrieve_and_format_questions)
    | questions_prompt
    | structured_model(QuestionsResponse)
)