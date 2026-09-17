from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq

from app.config import GOOGLE_API_KEY, GROQ_API_KEY


_primary_model = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    google_api_key=GOOGLE_API_KEY,
)

_backup_model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=GROQ_API_KEY,
)

model = _primary_model.with_fallbacks([_backup_model])

def structured_model(schema):
    return _primary_model.with_structured_output(schema).with_fallbacks(
        [_backup_model.with_structured_output(schema)]
    )

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=GOOGLE_API_KEY,
)