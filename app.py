from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)

API_TOKEN = "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"
API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
headers = {"Authorization": f"Bearer {API_TOKEN}"}

# --- الجزء الخاص بتحليل النصوص (كما هو دون تعديل في المنطق) ---
@app.route('/check', methods=['POST'])
def final_check():
    try:
        data = request.json
        user_text = data.get("text", "").lower()
        severe_keywords = ["دخان", "صوت قوي", "طقطقه", "انفجار", "حريق", "مكينة", "محرك", "شاصيه", "قوي", "متدمرة"]
        minor_keywords = ["خدش", "بسيط", "خفيف", "حكة", "مراية", "لمبة", "سطحي"]

        if any(word in user_text for word in severe_keywords):
            translated_text = "severe engine damage and smoke"
        elif any(word in user_text for word in minor_keywords):
            translated_text = "just a minor scratch"
        else:
            translated_text = user_text

        response = requests.post(API_URL, headers=headers, json={"inputs": translated_text})
        
        if response.status_code == 200:
            result = response.json()
            label = result[0][0]['label']
            return jsonify({"prediction": label})
        
        return jsonify({"prediction": "POSITIVE" if "minor" in translated_text else "NEGATIVE"})
    except Exception as e:
        return jsonify({"prediction": "POSITIVE"})

# --- الجزء الجديد: تحليل مكان الصدمة في الصورة ---
@app.route('/diagnose-image', methods=['POST'])
def diagnose_image():
    try:
        if 'carImage' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        
        file = request.files['carImage']
        # تحويل الصورة إلى مصفوفة رقمية لمعالجتها
        img_array = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        # تحويل الصورة لأبعاد قياسية للفحص
        img_resized = cv2.resize(img, (300, 300))
        
        # تقسيم الصورة إلى مناطق (يسار، منتصف، يمين) لتحديد مكان الصدمة
        # سنحسب كثافة التغير اللوني في كل منطقة
        height, width, _ = img_resized.shape
        left_zone = img_resized[:, 0:100]
        center_zone = img_resized[:, 100:200]
        right_zone = img_resized[:, 200:300]

        def get_damage_score(zone):
            # استخدام كاشف الحواف لتحديد التعرجات الناتجة عن الصدمات
            edges = cv2.Canny(zone, 100, 200)
            return np.sum(edges)

        scores = {
            "الجهة اليسرى (Left Side)": get_damage_score(left_zone),
            "المقدمة / المنتصف (Front/Center)": get_damage_score(center_zone),
            "الجهة اليمنى (Right Side)": get_damage_score(right_zone)
        }

        # تحديد المنطقة ذات "أعلى تضرر"
        location = max(scores, key=scores.get)
        
        # تجهيز الرد بناءً على المنطقة المكتشفة
        diagnosis_data = {
            "location": location,
            "problem": f"تم رصد تشوه في هيكل المركبة عند {location} باستخدام تحليل البكسلات.",
            "solution": "يتطلب الأمر فحص استقامة الشاصيه وسمكرة خارجية.",
            "costMin": 2500 if "Center" in location else 1200,
            "costMax": 6000 if "Center" in location else 3500,
            "color": "#ff4d4d"
        }

        return jsonify({"diagnosis": diagnosis_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # بورت 10000 مناسب لـ Render
    app.run(host='0.0.0.0', port=10000)
