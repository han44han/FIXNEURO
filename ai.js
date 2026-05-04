import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const textResBox = document.getElementById('text-result-box');
    const textContent = document.getElementById('text-res-content');
    const imageResBox = document.getElementById('image-result-box');
    // جلب فئة السيارة لزيادة دقة التحليل
    const carCategory = document.getElementById('carCategory')?.value || "1";

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    if (imageResBox) imageResBox.style.display = 'none';
    textResBox.style.display = 'block';
    textContent.innerHTML = "⏳ جاري فحص الأعطال بدقة...";

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // إرسال النص مع فئة السيارة لتحسين دقة الرد من السيرفر
            body: JSON.stringify({ 
                text: textInput.value,
                category: carCategory 
            })
        });
        const data = await response.json();
        
        // تحسين عرض النتيجة لتكون مفصلة
        const result = data.prediction || data.class || "تحتاج لفحص فيزيائي";
        
        textContent.innerHTML = `
            <div style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05);">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📋 تقرير التشخيص الذكي:</h3>
                <p style="margin-bottom:8px;"><strong>وصف العطل:</strong> ${textInput.value}</p>
                <p style="color: #ffcc00;"><strong>النتيجة المتوقعة:</strong> ${result === 'NEGATIVE' ? 'يُنصح بفحص منظومة التبريد أو المحرك فوراً' : result}</p>
                <p style="font-size: 12px; color: #7a9abf; margin-top:10px;">* ملاحظة: هذا التشخيص تم بناءً على تحليل الأنماط النصية المدخلة.</p>
            </div>
        `;
    } catch (error) {
        textContent.innerText = "❌ تعذر الوصول لمحرك الذكاء الاصطناعي.";
    }
}

export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');
    const textResBox = document.getElementById('text-result-box');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة واضحة للعطل");
        return;
    }

    if (textResBox) textResBox.style.display = 'none';
    imageResBox.style.display = 'block';
    imageContent.innerHTML = "⏳ جاري تحليل بكسلات الصورة...";
    imageDisplay.style.display = 'none';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        // معالجة النتيجة بدقة أكبر
        const confidence = data.confidence ? `(دقة التحليل: ${Math.round(data.confidence * 100)}%)` : "";
        const prediction = data.prediction || data.class || "ضرر غير محدد بدقة";

        imageContent.innerHTML = `
            <div style="padding:15px; background: rgba(77,184,255,0.05); border-radius: 10px;">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 نتيجة الفحص البصري:</h3>
                <p style="font-size: 18px; color: #fff;">${prediction}</p>
                <p style="color: #4db8ff; font-size: 13px; margin-top:5px;">${confidence}</p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
        };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ فشل تحليل بيانات الصورة.";
    }
}

window.diagnoseText = diagnoseText;
window.diagnoseImage = diagnoseImage;
