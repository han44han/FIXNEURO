from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

API_TOKEN = "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"
API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
headers = {"Authorization": f"Bearer {API_TOKEN}"}

@app.route('/check', methods=['POST'])
def final_check():
    try:
        data = request.json
        user_text = data.get("text", "").lower()

        # --- قاموس الترجمة الذكي للسيارات ---
        # كلمات تدل على ضرر جسيم (ستعطي نتيجة حمراء)
        severe_keywords = ["دخان", "صوت قوي", "طقطقه", "انفجار", "حريق", "مكينة", "محرك", "شاصيه", "قوي", "متدمرة"]
        # كلمات تدل على ضرر خفيف (ستعطي نتيجة زرقاء)
        minor_keywords = ["خدش", "بسيط", "خفيف", "حكة", "مراية", "لمبة", "سطحي"]

        # التحقق من الكلمات العربية أولاً
        if any(word in user_text for word in severe_keywords):
            translated_text = "severe engine damage and smoke"
        elif any(word in user_text for word in minor_keywords):
            translated_text = "just a minor scratch"
        else:
            # إذا لم يجد كلمات عربية، يرسل النص كما هو (لعل المستخدم كتب بالإنجليزي)
            translated_text = user_text

        # إرسال النص (سواء المترجم أو الأصلي) للموديل
        response = requests.post(API_URL, headers=headers, json={"inputs": translated_text})
        
        if response.status_code == 200:
            result = response.json()
            label = result[0][0]['label']
            return jsonify({"prediction": label})
        
        # حالة احتياطية إذا فشل السيرفر الخارجي
        return jsonify({"prediction": "POSITIVE" if "minor" in translated_text else "NEGATIVE"})

    except Exception as e:
        return jsonify({"prediction": "POSITIVE"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
