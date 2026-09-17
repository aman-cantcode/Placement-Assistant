from langchain_chroma import Chroma

from app.config import CHROMA_DB_DIR
from app.llm import embeddings

def make_retriever(collection_name: str, k: int ) : 
    vectorstore = Chroma(
        colection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(CHROMA_DB_DIR),
    )
    return vectorstore.as_retriever(search_kwargs={"k" : k})