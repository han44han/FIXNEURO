import os
import requests
import io
import torch
import numpy as np
import cv2
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS

# استيراد أدوات Detectron2
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo

app = Flask(__name__)

# إعداد CORS بشكل شامل للسماح بجميع الرؤوس والطرق من موقع Vercel
CORS(app, resources={r"/*": {
    "origins": ["https://fixneuro.vercel.app"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# دالة للتعامل مع طلبات OPTIONS (Preflight) يدوياً للتأكد من حل مشكلة CORS
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "https://fixneuro.vercel.app")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        return response

# --- كود تحميل الموديل تلقائياً من جوجل درايف ---
def download_model():
    model_id = '1SCiXoupm2eDFLqzjUKH2b8KGT0zQwpCx'
    url = f'https://drive.google.com/uc?export=download&id={model_id}'
    output = 'model_final.pth'
    if not os.path.exists(output):
        print("Downloading model from Google Drive...")
        response = requests.get(url, stream=True)
        with open(output, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    return output

MODEL_PATH = download_model()

# --- إعداد الموديل (Detectron2 Configuration) ---
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"))
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 5 
cfg.MODEL.WEIGHTS = MODEL_PATH
cfg.MODEL.DEVICE = "cpu" 
predictor = DefaultPredictor(cfg)

class_names = ["Scratch", "Dent", "Broken Glass", "Severe Damage", "Clean"]

@app.route('/')
def home():
    return "FixNeuro AI Server is Running!"

# --- مسار التشخيص النصي (تم تحديثه لحل مشكلة CORS) ---
@app.route('/check', methods=['POST', 'OPTIONS'])
def check_text():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        text_input = data.get('text', '').lower()
        
        # كلمات مفتاحية لتحديد النتيجة (يمكنك استبدالها بموديلك)
        negative_keywords = ['صدمة', 'عطل', 'حادث', 'صوت', 'broken', 'damage', 'accident', 'smoke']
        is_negative = any(word in text_input for word in negative_keywords)
        
        response = jsonify({
            "status": "success",
            "prediction": "NEGATIVE" if is_negative else "POSITIVE"
        })
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- مسار التشخيص بالصور ---
@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    outputs = predictor(img)
    classes = outputs["instances"].pred_classes.tolist()
    
    prediction_text = class_names[classes[0]] if len(classes) > 0 else "Clean"

    return jsonify({
        "status": "success",
        "prediction": prediction_text
    })

def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "https://fixneuro.vercel.app")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
