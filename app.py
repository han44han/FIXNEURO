import os
import requests
import numpy as np
import cv2
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# استيراد أدوات Detectron2
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo

app = FastAPI(title="FixNeuro AI API")

# 1. إعداد CORS للسماح بالوصول من Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fixneuro.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# قاموس الحلول
TEXT_SOLUTIONS = {
    "engine": {"diag": "مشكلة في المحرك أو نظام الاحتراق", "sol": "يجب فحص البواجي وصمام الثروتل فوراً."},
    "brake": {"diag": "تآكل في فحمات الفرامل", "sol": "يرجى تغيير الفحمات وفحص الهوبات لسلامتك."},
    "noise": {"diag": "خلل في نظام التعليق", "sol": "تحتاج السيارة لفحص جلب المقصات والمساعدات."},
    "battery": {"diag": "ضعف في البطارية أو الدينامو", "sol": "افحص جهد البطارية ونظف أقطابها."}
}

IMAGE_SOLUTIONS = {
    "Scratch": "خدوش سطحية في الطلاء. الحل: تلميع (Polishing).",
    "Dent": "انبعاج في الهيكل. الحل: سمكرة على البارد أو شفط.",
    "Broken Glass": "كسر في الزجاج. الحل: استبدال الزجاج المتضرر.",
    "Severe Damage": "تضرر هيكلي جسيم. الحل: سمكرة شاملة ورش دهان.",
    "Clean": "الهيكل سليم تماماً. الحل: لا يتطلب إصلاح."
}

# 2. تحميل الموديل
def download_model():
    model_id = '1SCiXoupm2eDFLqzjUKH2b8KGT0zQwpCx'
    url = f'https://drive.google.com/uc?export=download&id={model_id}'
    output = 'model_final.pth'
    if not os.path.exists(output):
        response = requests.get(url, stream=True)
        with open(output, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    return output

MODEL_PATH = download_model()

# 3. إعداد الموديل
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"))
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 5 
cfg.MODEL.WEIGHTS = MODEL_PATH
cfg.MODEL.DEVICE = "cpu"
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.4 # تحسين الحساسية
predictor = DefaultPredictor(cfg)

class_names = ["Scratch", "Dent", "Broken Glass", "Severe Damage", "Clean"]

class TextRequest(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "FixNeuro FastAPI is running"}

# 4. مسار التشخيص النصي
@app.post("/check")
async def check_text(request: TextRequest):
    text_input = request.text.lower()
    diagnosis = "عطل غير محدد بدقة"
    solution = "يفضل فحص السيارة لدى فني مختص."
    prediction = "POSITIVE"

    for key, val in TEXT_SOLUTIONS.items():
        if key in text_input:
            diagnosis = val["diag"]
            solution = val["sol"]
            prediction = "NEGATIVE"
            break
            
    return {
        "status": "success",
        "prediction": prediction,
        "diagnosis": diagnosis,
        "solution": solution
    }

# 5. مسار التشخيص بالصور
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        outputs = predictor(img)
        instances = outputs["instances"]
        
        if len(instances) > 0:
            pred_classes = instances.pred_classes.tolist()
            detected_labels = list(set([class_names[i] for i in pred_classes]))
            
            if len(detected_labels) > 1 and "Clean" in detected_labels:
                detected_labels.remove("Clean")
            
            res_class = " + ".join(detected_labels)
            solutions = [IMAGE_SOLUTIONS.get(label, "فحص فني.") for label in detected_labels]
            solution_text = " | ".join(solutions)
        else:
            res_class = "Clean"
            solution_text = IMAGE_SOLUTIONS["Clean"]

        return {
            "status": "success",
            "prediction": res_class,
            "solution": solution_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
