import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// 1. دالة تشخيص النص (تحليل دقيق وشرح مفصل)
export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const textResBox = document.getElementById('text-result-box');
    const textContent = document.getElementById('text-res-content');
    const imageResBox = document.getElementById('image-result-box');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    if (imageResBox) imageResBox.style.display = 'none';
    textResBox.style.display = 'block';
    textContent.innerHTML = "⏳ جاري تحليل مكونات العطل وشرح الأسباب...";

    // إرسال طلب يجبر الذكاء الاصطناعي على الشرح كخبير
    const detailedPrompt = `بصفتك خبير ميكانيكي، حلل هذا العطل: "${textInput.value}". اشرح السبب الميكانيكي، القطع المتأثرة، وطريقة الإصلاح المتوقعة.`;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: detailedPrompt })
        });
        const data = await response.json();
        let analysis = data.prediction || data.class || "تحليل غير متوفر";

        // تحويل الردود المختصرة لشرح مفهوم
        if (analysis === 'NEGATIVE') {
            analysis = "النظام يرصد خللاً في أداء المحرك أو احتراق الوقود. قد تحتاج لفحص البواجي أو حساس الهواء.";
        }

        textContent.innerHTML = `
            <div style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05); line-height:1.8;">
                <h3 style="color:#4db8ff; margin-bottom:12px;">🔍 التقرير التحليلي لـ FixNeuro:</h3>
                <div style="color:#fff;">${analysis}</div>
            </div>
        `;
    } catch (error) {
        textContent.innerText = "❌ فشل النظام في الاتصال.";
    }
}

// 2. دالة تشخيص الصور (تحديد مكان الصدمة ونوع الضرر)
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');
    const textResBox = document.getElementById('text-result-box');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة واضحة");
        return;
    }

    if (textResBox) textResBox.style.display = 'none';
    imageResBox.style.display = 'block';
    imageContent.innerHTML = "⏳ جاري تحديد مكان الضرر ونوع الإصابة...";

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        const damageType = data.prediction || "ضرر ناتج عن اصطدام";
        const damageLocation = data.location || "المنطقة الموضحة في الصورة";

        imageContent.innerHTML = `
            <div style="padding:15px; background: rgba(13,31,60,0.8); border: 1px solid #4db8ff; border-radius: 12px;">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 تقرير الفحص البصري:</h3>
                <p><strong>نوع الضرر:</strong> <span style="color:#ff4d4d;">${damageType}</span></p>
                <p><strong>مكان الإصابة:</strong> <span style="color:#4db8ff;">${damageLocation}</span></p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
        };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ فشل تحديد تفاصيل الصورة.";
    }
}

// --- هام جداً: هذا السطر هو الذي يجعل الأزرار تعمل ---
window.diagnoseText = diagnoseText;
window.diagnoseImage = diagnoseImage;
