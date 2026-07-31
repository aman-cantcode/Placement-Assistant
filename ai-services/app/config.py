from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")