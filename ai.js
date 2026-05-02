import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img'); // نحتاج الصورة لإخفائها

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    // إخفاء الصورة القديمة فوراً وتغيير النص لانتظار التحليل
    if (resImg) resImg.style.display = 'none';
    resText.innerHTML = "⏳ جاري تحليل وصف المشكلة...";
    resultBox.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });
        const data = await response.json();
        
        const prediction = data.prediction || data.class || "غير محدد";

        // عرض النتيجة الخاصة بالنص فقط وبشكل منسق
        resText.innerHTML = `
            <div style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05);">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📋 تقرير فحص العطل (نص):</h3>
                <p><strong>المشكلة المدخلة:</strong> ${textInput.value}</p>
                <p><strong>تحليل النظام:</strong> ${prediction === 'NEGATIVE' ? 'هذا العطل يتطلب فحصاً فنياً عاجلاً' : 'عطل يحتاج متابعة دورية'}</p>
            </div>
        `;
    } catch (error) {
        resText.innerText = "❌ تعذر الاتصال بمحرك التحليل.";
    }
}

export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const resultBox = document.getElementById('result-box');
    const resText = document.getElementById('res-text');
    const resImg = document.getElementById('res-img');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى اختيار صورة أولاً");
        return;
    }

    resText.innerHTML = "⏳ جاري فحص الصورة...";
    resultBox.style.display = 'block';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        let prediction = data.prediction || data.class || "تم رصد تضرر في الهيكل";

        resText.innerHTML = `
            <div style="border: 1px solid #4db8ff; padding: 15px; border-radius: 10px; background: rgba(77,184,255,0.05);">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 نتيجة الفحص البصري:</h3>
                <p>${prediction}</p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            resImg.src = e.target.result;
            resImg.style.display = 'block'; // إظهار الصورة فقط هنا
        };
        reader.readAsDataURL(imageInput.files[0]);
        
    } catch (error) {
        resText.innerText = "❌ فشل تحليل الصورة.";
    }
}
