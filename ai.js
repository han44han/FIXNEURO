import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// دالة موحدة لتنظيف صندوق النتائج تماماً قبل أي عملية
function clearResults() {
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');
    const resultBox = document.getElementById('result-box');
    
    if (resText) resText.innerHTML = ""; 
    if (resImg) {
        resImg.style.display = 'none';
        resImg.src = "";
    }
    if (resultBox) resultBox.style.display = 'none';
}

export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const resText = document.getElementById('res-text');
    const resultBox = document.getElementById('result-box');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    clearResults(); // مسح كل شيء قديم (نصوص أو صور)
    
    resultBox.style.display = 'block';
    resText.innerHTML = "⏳ جاري تحليل النص...";

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });
        const data = await response.json();
        const prediction = data.prediction || data.class || "غير محدد";

        resText.innerHTML = `
            <div id="text-result-template" style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05); text-align:right;">
                <h3 style="color:#4db8ff; margin:0 0 10px 0;">📋 نتيجة التشخيص النصي:</h3>
                <p style="margin:5px 0;"><strong>المشكلة المدخلة:</strong> ${textInput.value}</p>
                <p style="margin:5px 0;"><strong>التحليل الفني:</strong> ${prediction === 'NEGATIVE' ? 'تنبيه: مؤشر عطل فني' : 'الحالة تبدو مستقرة'}</p>
            </div>
        `;
    } catch (error) {
        resText.innerText = "❌ فشل الاتصال بمحرك النصوص.";
    }
}

export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');
    const resultBox = document.getElementById('result-box');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة أولاً");
        return;
    }

    clearResults(); // مسح كل شيء قديم بما في ذلك نصوص "الحرارة" السابقة
    
    resultBox.style.display = 'block';
    resText.innerHTML = "⏳ جاري فحص الصورة...";

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        const prediction = data.prediction || data.class || "تم رصد تضرر في الهيكل الخارجي";

        resText.innerHTML = `
            <div id="image-result-template" style="border: 1px solid #4db8ff; padding: 15px; border-radius: 10px; background: rgba(77,184,255,0.05); text-align:right;">
                <h3 style="color:#4db8ff; margin:0 0 10px 0;">📍 نتيجة الفحص البصري:</h3>
                <p style="margin:0;">${prediction}</p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            resImg.src = e.target.result;
            resImg.style.display = 'block';
            resImg.style.marginTop = '15px';
            resImg.style.borderRadius = '8px';
        };
        reader.readAsDataURL(imageInput.files[0]);
        
    } catch (error) {
        resText.innerText = "❌ فشل الاتصال بمحرك الصور.";
    }
}

// ربط الدوال بالنافذة لضمان عملها
window.diagnoseText = diagnoseText;
window.diagnoseImage = diagnoseImage;
