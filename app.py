import os
import requests
import io
import torch
import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS

# استيراد أدوات Detectron2
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo

app = Flask(__name__)

# إعداد CORS بشكل كامل للسماح بالوصول من Vercel وحل مشكلة Preflight
CORS(app, resources={r"/*": {
    "origins": ["https://fixneuro.vercel.app"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

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
        print("Download complete.")
    return output

MODEL_PATH = download_model()

# --- إعداد الموديل (Detectron2 Configuration) ---
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"))
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 5  # تأكدي من مطابقتها لعدد الكلاسات في تدريبك
cfg.MODEL.WEIGHTS = MODEL_PATH
cfg.MODEL.DEVICE = "cpu"  # لأن Render المجاني لا يوفر GPU
predictor = DefaultPredictor(cfg)

# أسماء الفئات المكتشفة (يجب ترتيبها حسب ترتيب تدريب Kaggle)
class_names = ["Scratch", "Dent", "Broken Glass", "Severe Damage", "Clean"]

@app.route('/')
def home():
    return "FixNeuro AI Server is Running!"

# مسار التشخيص النصي المطللوب لملف ai.js
@app.route('/check', methods=['POST'])
def check_text():
    try:
        data = request.get_json()
        text_input = data.get('text', '').lower()
        
        # يمكنك هنا دمج الموديل النصي، حالياً سنرد بناءً على كلمات مفتاحية للتجربة
        negative_keywords = ['صدمة', 'عطل', 'حادث', 'broken', 'damage', 'accident']
        is_negative = any(word in text_input for word in negative_keywords)
        
        return jsonify({
            "status": "success",
            "prediction": "NEGATIVE" if is_negative else "POSITIVE"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# مسار التشخيص بالصور المربوط بـ diagnoseImage في ai.js
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    # تحويل الصورة إلى تنسيق OpenCV
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # إجراء التوقع
    outputs = predictor(img)
    classes = outputs["instances"].pred_classes.tolist()
    
    if len(classes) > 0:
        result_index = classes[0]
        prediction_text = class_names[result_index]
    else:
        prediction_text = "Clean"

    return jsonify({
        "status": "success",
        "prediction": prediction_text
    })

if __name__ == '__main__':
    # الحصول على المنفذ من بيئة Render
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
