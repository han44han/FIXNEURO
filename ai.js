import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// دالة تشخيص النص
export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    // تنظيف الواجهة وإخفاء الصورة فوراً
    if (resImg) {
        resImg.style.display = 'none';
        resImg.src = '';
    }
    resText.innerHTML = "⏳ جاري تحليل النص...";
    resultBox.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });
        const data = await response.json();
        const prediction = data.prediction || data.class || "غير محدد";

        resText.innerHTML = `
            <div style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05);">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📋 نتيجة التشخيص النصي:</h3>
                <p><strong>المشكلة:</strong> ${textInput.value}</p>
                <p><strong>التحليل:</strong> ${prediction === 'NEGATIVE' ? 'عطل يحتاج فحص فني' : 'حالة مستقرة'}</p>
            </div>
        `;
    } catch (error) {
        resText.innerText = "❌ خطأ في الاتصال بالسيرفر.";
    }
}

// دالة تشخيص الصور
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة أولاً");
        return;
    }

    // تنظيف الواجهة
    resText.innerHTML = "⏳ جاري فحص الصورة...";
    if (resImg) resImg.style.display = 'none';
    resultBox.style.display = 'block';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        const prediction = data.prediction || data.class || "تم كشف ضرر خارجي";

        resText.innerHTML = `
            <div style="border: 1px solid #4db8ff; padding: 15px; border-radius: 10px; background: rgba(77,184,255,0.05);">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 نتيجة الفحص البصري:</h3>
                <p>${prediction}</p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            resImg.src = e.target.result;
            resImg.style.display = 'block';
            resImg.style.marginTop = '15px';
        };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        resText.innerText = "❌ خطأ في تحليل الصورة.";
    }
}

