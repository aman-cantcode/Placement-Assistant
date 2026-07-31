from fastapi import APIRouter, Dependsfrom app.schemas import AnalyzeRequest, AnalysisResultfrom app.security import verify_internal_keyfrom app.chains.analyze_chain import chain as analyze_chainrouter = APIRouter()@router.post("/analyze", response_model=AnalysisResult)def analyze(request: AnalyzeRequest, _=Depends(verify_internal_key)):    result = analyze_chain.invoke({        "resume_text": request.resume_text,        "jd_text": request.jd_text    })    return resultfrom fastapi import APIRouter, Depends
from app.schemas import AnalyzeRequest, AnalysisResult
from app.security import verify_internal_key
from app.chains.analyze_chain import chain

router = APIRouter(
    dependencies=[Depends(verify_internal_key)]
)

@router.post("/analyze", response_model=AnalysisResult)
def analyze(request: AnalyzeRequest):
    result = chain.invoke({
        "resume_text": request.resume_text,
        "jd_text": request.jd_text,
    })
    return result