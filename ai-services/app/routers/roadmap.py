from fastapi import APIRouter, Depends
from app.schemas import RoadmapRequest, RoadmapResponse
from app.security import verify_internal_key
from app.chains.roadmap_chain import chain as roadmap_chain

router = APIRouter(
    dependencies=[Depends(verify_internal_key)],
)

@router.post("/roadmap", response_model=RoadmapResponse)
def roadmap(request: RoadmapRequest):
    result = roadmap_chain.invoke({
        "resume_text": request.resume_text,
        "missing_skills": request.missing_skills
    })
    return RoadmapResponse(roadmap=result)