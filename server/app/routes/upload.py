from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import uuid
import os

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-audio/")
async def upload_audio(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # TODO: Trigger transcription job here
    
    return JSONResponse({"status": "success", "file_path": file_path})
