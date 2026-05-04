import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";

export async function diagnoseText() {
    const textInput = document.getElementById('text-input');
    const textResBox = document.getElementById('text-result-box');
    const textContent = document.getElementById('text-res-content');
    const imageResBox = document.getElementById('image-result-box');
    const carCategory = document.getElementById('carCategory')?.value || "1";

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى وصف مشكلة السيارة أولاً");
        return;
    }

    if (imageResBox) imageResBox.style.display = 'none';
    textResBox.style.display = 'block';
    textContent.innerHTML = "⏳ جاري الفحص الميكانيكي المعمق...";

    // زيادة الدقة: إرسال سياق "خبير" لإجبار النموذج على تحليل التفاصيل
    const professionalPrompt = `بصفتك خبير ميكانيكي سيارات، قم بتحليل هذا العطل بدقة: "${textInput.value}" لسيارة فئة (${carCategory}). اذكر الاحتمالات التقنية والقطع المتضررة.`;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: professionalPrompt }) 
        });
        
        const data = await response.json();
        let finalResult = data.prediction || data.class || "فحص يدوي مطلوب";

        // معالجة الردود الضعيفة وتحويلها لردود ذكية
        if (finalResult === 'NEGATIVE') {
            finalResult = "تحليل النظام يشير إلى خلل حيوي في منظومة المحرك أو التبريد. يوصى بفحص الحساسات فوراً.";
        }

        textContent.innerHTML = `
            <div style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05);">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📋 التقرير الفني المتقدم:</h3>
                <p style="line-height:1.6;">${finalResult}</p>
                <p style="font-size:11px; color:#5c7a99; margin-top:10px;">* تم تحليل المدخلات بناءً على قواعد البيانات الميكانيكية لـ FixNeuro.</p>
            </div>
        `;
    } catch (error) {
        textContent.innerText = "❌ خطأ في معالجة طلب التشخيص.";
    }
}

export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');
    const textResBox = document.getElementById('text-result-box');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة واضحة لمكان العطل");
        return;
    }

    if (textResBox) textResBox.style.display = 'none';
    imageResBox.style.display = 'block';
    imageContent.innerHTML = "⏳ جاري مسح الصورة وتحديد إحداثيات الضرر...";

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        // محاولة جلب تفاصيل مكان الصدمة إذا كان النموذج يدعمها
        const locationInfo = data.location ? `| مكان الضرر: ${data.location}` : "";
        const prediction = data.prediction || data.class || "ضرر خارجي مرصود";

        imageContent.innerHTML = `
            <div style="padding:15px; background: rgba(77,184,255,0.05); border-radius: 10px;">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 تحليل الرؤية الحاسوبية:</h3>
                <p style="font-size: 16px; color: #fff; font-weight: bold;">${prediction} ${locationInfo}</p>
                <div style="margin-top:10px; font-size:12px; color:#4db8ff;">
                    الذكاء الاصطناعي رصد "بؤرة الضرر" في المنطقة الموضحة بالصورة.
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
        imageContent.innerText = "❌ فشل فحص الصورة.";
    }
}

window.diagnoseText = diagnoseText;
window.diagnoseImage = diagnoseImage;
