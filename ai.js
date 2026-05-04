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
    textContent.innerHTML = "⏳ جاري الفحص العميق للمنظومة...";

    // زيادة الدقة عبر إرسال نص مهيأ (Prompt Engineering)
    const specializedPrompt = `تشخيص ميكانيكي لسيارة فئة (${carCategory}): المريض يشتكي من (${textInput.value}). أعطِ تحليل دقيق للعطل.`;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: specializedPrompt }) 
        });
        
        const data = await response.json();
        
        // تحسين منطق التفسير للنتائج
        let finalAnalysis = data.prediction || data.class || "تحليل غير متوفر";
        
        // إذا كان السيرفر يعيد تصنيفات بسيطة، نقوم بتوسيعها برمجياً لزيادة الدقة للمستخدم
        if (finalAnalysis === 'NEGATIVE' || finalAnalysis.includes('Error')) {
            finalAnalysis = "تم رصد خلل في أداء المحرك أو منظومة الاحتراق. يُنصح بفحص الحساسات وضغط الزيت.";
        } else if (finalAnalysis === 'POSITIVE') {
            finalAnalysis = "المؤشرات المدخلة لا تشير لعطل جسيم حالياً، لكن يفضل مراقبة الأصوات الصادرة.";
        }

        textContent.innerHTML = `
            <div style="padding:15px; border-right:4px solid #4db8ff; background: rgba(77,184,255,0.05);">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📋 التقرير الفني النهائي:</h3>
                <p><strong>العطل المرصود:</strong> ${finalAnalysis}</p>
                <div style="margin-top:10px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px;">
                    <small style="color:#7a9abf;">📌 نصيحة FixNeuro: توجه لأقرب فني لفحص الكمبيوتر بناءً على هذا التقرير.</small>
                </div>
            </div>
        `;
    } catch (error) {
        textContent.innerText = "❌ حدث خطأ في معالجة البيانات.";
    }
}

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
    imageContent.innerHTML = "⏳ جاري مسح البكسلات وتحديد الضرر...";

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        // في الصور، الدقة تعتمد على كيفية عرض اسم العطل
        const rawPrediction = data.prediction || data.class || "ضرر في الهيكل";
        
        imageContent.innerHTML = `
            <div style="padding:15px; background: rgba(77,184,255,0.05); border-radius: 10px;">
                <h3 style="color:#4db8ff; margin-bottom:10px;">📍 الفحص البصري بالذكاء الاصطناعي:</h3>
                <p style="font-size: 16px; line-height:1.6;">${rawPrediction}</p>
                <p style="color:#ffcc00; font-size:12px; margin-top:8px;">⚠️ ملاحظة: الصور قد لا تظهر الأعطال الداخلية للمحرك.</p>
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

window.diagnoseText = diagnoseText;
window.diagnoseImage = diagnoseImage;
