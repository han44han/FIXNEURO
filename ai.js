import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

// 1. تشخيص النص: تحليل ميكانيكي عميق مع شرح الأسباب
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
    textContent.innerHTML = "⏳ جاري تحليل العطل ميكانيكياً...";

    // إرسال تعليمات صارمة للسيرفر لتقديم شرح مفصل
    const detailedPrompt = `بصفتك خبير صيانة، حلل العطل التالي: "${textInput.value}". اذكر القطع المتضررة بالضبط، سبب المشكلة، وكيفية الإصلاح.`;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: detailedPrompt })
        });
        const data = await response.json();
        let analysis = data.prediction || data.class || "التحليل غير متاح حالياً";

        // تحويل الردود التقنية الجافة لشرح بشري دقيق
        if (analysis === 'NEGATIVE') {
            analysis = "النظام يشير إلى وجود خلل في 'دورة الاحتراق' أو 'منظومة الوقود'. يرجى فحص شمعات الاحتراق (البواجي) وحساس الأكسجين.";
        }

        textContent.innerHTML = `
            <div style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05); line-height:1.8; text-align:right;">
                <h3 style="color:#4db8ff; margin-bottom:12px;">🔍 الشرح الميكانيكي الدقيق:</h3>
                <div style="color:#fff; font-size:15px;">${analysis}</div>
            </div>
        `;
    } catch (error) {
        textContent.innerText = "❌ فشل الاتصال بمحرك التحليل.";
    }
}

// 2. تشخيص الصور: تحديد نوع الصدمة وموقعها في السيارة
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');
    const textResBox = document.getElementById('text-result-box');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة واضحة للصدمة");
        return;
    }

    if (textResBox) textResBox.style.display = 'none';
    imageResBox.style.display = 'block';
    imageContent.innerHTML = "⏳ جاري فحص هيكل السيارة وتحديد موقع الضرر...";

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        // محاولة استخراج الموقع والنوع بدقة
        const damageType = data.prediction || "تضرر في الهيكل الخارجي";
        const damageLocation = data.location || "منطقة الاصطدام الموضحة في الصورة";

        imageContent.innerHTML = `
            <div style="padding:15px; background: rgba(13,31,60,0.8); border: 1px solid #4db8ff; border-radius: 12px; text-align:right;">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 تقرير الفحص البصري:</h3>
                <p style="margin-bottom:8px;"><strong>نوع الضرر:</strong> <span style="color:#ff4d4d;">${damageType}</span></p>
                <p><strong>موقع الإصابة في السيارة:</strong> <span style="color:#4db8ff;">${damageLocation}</span></p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
        };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ تعذر تحليل الصورة.";
    }
}

// الحل الجذري لمشكلة الأزرار: ربط الدوال بالنافذة العامة
window.diagnoseText = diagnoseText;
window.diagnoseImage = diagnoseImage;
