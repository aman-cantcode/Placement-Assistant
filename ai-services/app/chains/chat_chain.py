from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda

from app.llm import model, backup_model


def convert_to_langchain_messages(messages):
    converted = []

    for message in messages:
        if message.role == "user":
            converted.append(HumanMessage(content=message.content))
        elif message.role == "assistant":
            converted.append(AIMessage(content=message.content))

    return converted


def prepare_chat_input(inputs):
    return {
        "resume_text": inputs["resume_text"],
        "jd_text": inputs["jd_text"],
        "history": convert_to_langchain_messages(inputs["messages"]),
        "new_message": inputs["new_message"],
    }


prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are a placement assistant.

        You know the candidate's resume and target job description.

        Only answer questions related to:
        - Resume
        - Job description
        - Interview preparation
        - Skills
        - Career guidance
        - Placement preparation

        If the user asks something unrelated, politely refuse.

        RESUME:
        {resume_text}

        JOB DESCRIPTION:
        {jd_text}
        """,
    ),
    MessagesPlaceholder("history"),
    (
        "human",
        "{new_message}",
    ),
])


chat_chain = (
    RunnableLambda(prepare_chat_input)
    | prompt
    | model
    | model.with_fallbacks([backup_model])
    | StrOutputParser()
)

