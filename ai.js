import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// 1. دالة تشخيص النص
export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const textResBox = document.getElementById('text-result-box');
    const textContent = document.getElementById('text-res-content');
    const imageResBox = document.getElementById('image-result-box');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    // إخفاء نتائج الصور وتصفيرها
    if (imageResBox) imageResBox.style.display = 'none';
    
    // إظهار صندوق النصوص
    textResBox.style.display = 'block';
    textContent.innerHTML = "⏳ جاري تحليل النص...";

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });
        const data = await response.json();
        const prediction = data.prediction || data.class || "غير محدد";

        textContent.innerHTML = `
            <div style="padding:10px; border-right:4px solid #4db8ff;">
                <h3 style="color:#4db8ff; margin-bottom:8px;">📋 نتيجة التشخيص:</h3>
                <p><strong>المشكلة:</strong> ${textInput.value}</p>
                <p><strong>التحليل:</strong> ${prediction === 'NEGATIVE' ? 'عطل فني محتمل' : 'الحالة مستقرة'}</p>
            </div>
        `;
    } catch (error) {
        textContent.innerText = "❌ فشل الاتصال بالسيرفر.";
    }
}

// 2. دالة تشخيص الصور
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');
    const textResBox = document.getElementById('text-result-box');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة أولاً");
        return;
    }

    // إخفاء نتائج النصوص
    if (textResBox) textResBox.style.display = 'none';

    // إظهار صندوق الصور
    imageResBox.style.display = 'block';
    imageContent.innerHTML = "⏳ جاري فحص الصورة...";
    imageDisplay.style.display = 'none';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        const prediction = data.prediction || data.class || "ضرر خارجي مرصود";

        imageContent.innerHTML = `
            <div style="padding:10px;">
                <h3 style="color:#4db8ff; margin-bottom:8px;">📍 نتيجة الفحص البصري:</h3>
                <p>${prediction}</p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
        };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ فشل تحليل الصورة.";
    }
}

// السطر السحري الذي يجعل الأزرار "تضغط" وتعمل في الـ HTML
window.diagnoseText = diagnoseText;
window.diagnoseImage = diagnoseImage;
