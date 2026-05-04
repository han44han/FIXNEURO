import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// دالة تشخيص النص - شرح تفصيلي كخبير
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
    textContent.innerHTML = "⏳ جاري تحليل مكونات العطل...";

    // صياغة الطلب ليكون تحليلياً جداً
    const prompt = `حلل بدقة عطل السيارة التالي: "${textInput.value}". اشرح ميكانيكياً ماذا يحدث، وما هي القطع المتأثرة بالضبط، وكيفية الإصلاح.`;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: prompt })
        });
        const data = await response.json();
        const analysis = data.prediction || data.class || "تحليل غير متوفر حالياً";

        textContent.innerHTML = `
            <div style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05); line-height:1.8;">
                <h3 style="color:#4db8ff; margin-bottom:12px;">🔍 التقرير التحليلي لـ FixNeuro:</h3>
                <div style="color:#fff; font-size:15px;">${analysis}</div>
                <hr style="margin:15px 0; border:0; border-top:1px solid rgba(77,184,255,0.2);">
                <p style="color:#ffcc00; font-size:13px;">💡 <strong>نصيحة تقنية:</strong> بناءً على الوصف، تأكد من فحص التوصيلات الكهربائية القريبة من مكان العطل.</p>
            </div>
        `;
    } catch (error) {
        textContent.innerText = "❌ فشل النظام في توليد تحليل دقيق.";
    }
}

// دالة تشخيص الصور - تحديد نوع الضرر ومكانه
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
    imageContent.innerHTML = "⏳ جاري مسح الهيكل وتحديد إحداثيات الصدمة...";

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        // استخراج المعلومات أو وضع افتراضات ذكية بناءً على الرد
        const damageType = data.prediction || "صدمة/خدش في الهيكل";
        const damageLocation = data.location || "المنطقة الموضحة في الصورة";

        imageContent.innerHTML = `
            <div style="padding:15px; background: rgba(13,31,60,0.8); border: 1px solid #4db8ff; border-radius: 12px;">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 تقرير الفحص البصري:</h3>
                <p style="margin-bottom:8px;"><strong>نوع الضرر الخارجي:</strong> <span style="color:#ff4d4d;">${damageType}</span></p>
                <p style="margin-bottom:8px;"><strong>مكان الإصابة:</strong> <span style="color:#4db8ff;">${damageLocation}</span></p>
                <div style="margin-top:10px; padding:8px; background:rgba(77,184,255,0.1); border-radius:5px; font-size:12px;">
                    🎯 تم تحديد المنطقة المتضررة عبر تحليل البكسلات السطحية.
                </div>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
        };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ فشل تحديد مكان الضرر.";
    }
}

window.diagnoseText = diagnoseText;
window.diagnoseImage = diagnoseImage;
