from fastapi import Header, HTTPException
from app.config import INTERNAL_API_KEY

def verify_internal_key(x_internal_key: str = Header(...)):
    if x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")