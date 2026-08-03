from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
CHROMA_DB_DIR = BASE_DIR / "data" / "chroma_db"