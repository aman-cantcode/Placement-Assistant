from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq

from app.config import GOOGLE_API_KEY, GROQ_API_KEY


model = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    google_api_key=GOOGLE_API_KEY,
)

backup_model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=GROQ_API_KEY,
)

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=GOOGLE_API_KEY,
)