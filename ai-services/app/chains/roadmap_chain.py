from app.config import CHROMA_DB_DIR

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda


model = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001"
)

vectorstore = Chroma(
    collection_name="learning_resources",
    embedding_function=embeddings,
    persist_directory=str(CHROMA_DB_DIR),
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 5})


def format_docs(docs):
    return "\n".join(
        f"- {doc.metadata['title']} ({doc.metadata['url']})"
        for doc in docs
    )


def retrieve_and_format(inputs):
    query = ", ".join(inputs["missing_skills"])
    docs = retriever.invoke(query)

    return {
        "resume_text": inputs["resume_text"],
        "missing_skills": query,
        "context": format_docs(docs),
    }


prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a placement coach. Build a week-by-week learning roadmap using ONLY the resources listed under AVAILABLE RESOURCES. Do not invent resource names or URLs that aren't listed there.",
    ),
    (
        "human",
        "RESUME: {resume_text}\n\n"
        "MISSING SKILLS: {missing_skills}\n\n"
        "AVAILABLE RESOURCES:\n{context}\n\n"
        "Build a focused 3-4 week roadmap using only what's listed above.",
    ),
])


chain = (
    RunnableLambda(retrieve_and_format)
    | prompt
    | model
    | StrOutputParser()
)