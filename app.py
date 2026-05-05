import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import cv2

app = FastAPI()

# حل مشكلة CORS النهائية لـ Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fixneuro.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "FastAPI Server is Running!"}

# مسار التشخيص النصي
@app.post("/check")
async def check_text(data: dict):
    text_input = data.get("text", "").lower()
    damage_words = ["صوت", "طقطقه", "صدمه", "حادث"]
    is_negative = any(word in text_input for word in damage_words)
    return {"status": "success", "prediction": "NEGATIVE" if is_negative else "POSITIVE"}

# مسار التشخيص بالصور
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # هنا تضع كود الموديل الخاص بك (Detectron2)
    return {"status": "success", "prediction": "Clean"} # نتيجة افتراضية

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
