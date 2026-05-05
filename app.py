import os
import requests
import numpy as np
import cv2
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS

# استيراد أدوات Detectron2
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo

app = Flask(__name__)

# إعداد CORS للسماح بالوصول الكامل من Vercel
CORS(app, resources={r"/*": {
    "origins": ["https://fixneuro.vercel.app"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# قاموس الحلول للأعطال النصية
TEXT_SOLUTIONS = {
    "engine": {"diag": "مشكلة في المحرك أو نظام الاحتراق", "sol": "يجب فحص البواجي وصمام الثروتل فوراً."},
    "brake": {"diag": "تآكل في فحمات الفرامل أو نقص زيت الفرامل", "sol": "يرجى تغيير الفحمات وفحص الهوبات لسلامتك."},
    "noise": {"diag": "خلل في المساعدات أو نظام التعليق", "sol": "تحتاج السيارة لفحص جلب المقصات والمساعدات الأمامية."},
    "battery": {"diag": "ضعف في البطارية أو الدينامو", "sol": "افحص جهد البطارية ونظف أقطابها أو استبدلها إذا لزم الأمر."}
}

# قاموس الحلول لأعطال الصور (Detectron2)
IMAGE_SOLUTIONS = {
    "Scratch": "خدوش سطحية في الطلاء. الحل: تلميع (Polishing) أو تنقيط بوية.",
    "Dent": "انبعاج في الهيكل (دقة). الحل: سمكرة على البارد أو شفط بدون رش.",
    "Broken Glass": "كسر في الزجاج. الحل: استبدال الزجاج المتضرر لضمان الرؤية.",
    "Severe Damage": "تضرر هيكلي جسيم. الحل: سحب شاصيه وسمكرة شاملة ورش دهان.",
    "Clean": "الهيكل سليم تماماً. الحل: لا يتطلب إصلاح، حافظ على الصيانة الدورية."
}

# تحميل الموديل من جوجل درايف
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

# إعداد الموديل
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"))
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 5 
cfg.MODEL.WEIGHTS = MODEL_PATH
cfg.MODEL.DEVICE = "cpu" 
predictor = DefaultPredictor(cfg)
class_names = ["Scratch", "Dent", "Broken Glass", "Severe Damage", "Clean"]

@app.route('/check', methods=['POST', 'OPTIONS'])
def check_text():
    if request.method == "OPTIONS": return _cors_response()
    
    data = request.get_json()
    text_input = data.get('text', '').lower()
    
    # تحديد التشخيص بناءً على الكلمات المفتاحية
    diagnosis = "عطل غير محدد بدقة"
    solution = "يفضل فحص السيارة لدى فني كمبيوتر لتحديد الكود."
    prediction = "POSITIVE"

    for key, val in TEXT_SOLUTIONS.items():
        if key in text_input:
            diagnosis = val["diag"]
            solution = val["sol"]
            prediction = "NEGATIVE"
            break
            
    return jsonify({
        "status": "success",
        "prediction": prediction,
        "diagnosis": diagnosis,
        "solution": solution
    })

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == "OPTIONS": return _cors_response()

    file = request.files['file']
    nparr = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    outputs = predictor(img)
    
    # الحصول على التوقعات
    instances = outputs["instances"]
    if len(instances) > 0:
        # نأخذ أول كلاس تم اكتشافه
        cls_idx = instances.pred_classes[0].item()
        res_class = class_names[cls_idx]
    else:
        res_class = "Clean"

    # جلب الحل من القاموس الذي أنشأناه سابقاً
    # تأكدي أن IMAGE_SOLUTIONS معرفة في أعلى الملف
    solution_text = IMAGE_SOLUTIONS.get(res_class, "يرجى فحص السيارة بدقة لدى فني مختص.")

    return jsonify({
        "status": "success",
        "prediction": res_class,
        "solution": solution_text  # هذا السطر هو الذي سيمنع ظهور undefined
    })

def _cors_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "https://fixneuro.vercel.app")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
