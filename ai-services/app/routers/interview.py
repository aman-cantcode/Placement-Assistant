from fastapi import APIRouter, Depends
from app.schemas import QuestionsRequest, RateRequest, RateResponse, RateResult
from app.security import verify_internal_key
from app.chains.questions_chain import questions_chain, QuestionsResult

router = APIRouter(
    dependencies=[Depends(verify_internal_key)],
)

@router.post("/interview/questions", response_model=QuestionsResult)
def generate_questions(request: QuestionsRequest):
    return questions_chain.invoke({
        "resume_text": request.resume_text,
        "jd_text": request.jd_text
    })

from app.chains.rate_chain import rate_chain

@router.post("/interview/rate", response_model=RateResponse)
def rate_answers(request: RateRequest):

    ratings = []

    for item in request.items:
        result = rate_chain.invoke({
            "jd_text": request.jd_text,
            "question": item.question,
            "answer": item.answer,
        })

        ratings.append(
            RateResult(
                rating=result.rating,
                feedback=result.feedback,
            )
        )

    return RateResponse(ratings=ratings)