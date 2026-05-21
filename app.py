from fastapi import FastAPI, File, UploadFile
import shutil
from ai_service import detect

app = FastAPI()

@app.get("/")
def home():
    return {"message": "RoadWatch API running"}

@app.post("/detect")
async def detect_pothole(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = detect(file_path)

    return {"result": str(result)}