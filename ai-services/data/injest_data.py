import json
import time
from pathlib import Path

import app.config
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_google_genai._common import GoogleGenerativeAIError

#run from ai-services as module 

DATA_DIR = Path(__file__).resolve().parent

RESOURCES_FILE = DATA_DIR / "learning-resources-dataset.json"
QUESTIONS_FILE = DATA_DIR / "interview-questions-dataset.json"
PERSIST_DIR = DATA_DIR / "chroma_db"

BATCH_SIZE = 20
RETRY_DELAY = 65


embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001"
)


def load_json(path: Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_resource_documents():
    resources = load_json(RESOURCES_FILE)

    return [
        Document(
            page_content=f"{r['skill']}: {r['title']}. {r['description']}",
            metadata={
                "id": r["id"],
                "skill": r["skill"],
                "title": r["title"],
                "description": r["description"],
                "url": r["url"],
                "level": r["level"],
            },
        )
        for r in resources
    ]


def build_question_documents():
    questions = load_json(QUESTIONS_FILE)

    return [
        Document(
            page_content=f"{q['skill']}: {q['question']}",
            metadata={
                "id": q["id"],
                "skill": q["skill"],
                "question": q["question"],
                "difficulty": q["difficulty"],
            },
        )
        for q in questions
    ]


def ingest(collection_name: str, documents: list[Document]):
    db = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(PERSIST_DIR),
    )

    total = len(documents)

    for start in range(0, total, BATCH_SIZE):
        batch = documents[start:start + BATCH_SIZE]

        while True:
            try:
                db.add_documents(batch)
                break

            except GoogleGenerativeAIError as e:
                if "RESOURCE_EXHAUSTED" not in str(e):
                    raise

                print(f"\nRate limit reached. Waiting {RETRY_DELAY} seconds...\n")
                time.sleep(RETRY_DELAY)

        print(f"{collection_name}: {min(start + BATCH_SIZE, total)}/{total}")

    print(f"✓ Finished {collection_name}")


def main():
    ingest("learning_resources", build_resource_documents())
    ingest("interview_questions", build_question_documents())

    print("\n✓ Vector database ready.")


if __name__ == "__main__":
    main()