import { supabase } from './database.js';

const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل!");
        return;
    }

    // الخطوة السحرية: مسح النتيجة القديمة تماماً قبل البدء
    resultDiv.innerHTML = ""; 
    
    // إضافة رسالة انتظار مؤقتة
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري التحليل...</p></div>`;
    
    if(btn) { btn.disabled = true; btn.innerText = "جاري الفحص..."; }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const userText = textInput.value.toLowerCase();
        const multiplier = parseFloat(carCategory.value) || 1;

        // تحديد التشخيص (بناءً على كلامك السابق)
        let diag = {
            title: "فحص عام",
            problem: "مشكلة تقنية محتملة.",
            solution: "افحص السيارة بالكمبيوتر.",
            costMin: 150, costMax: 300,
            color: "#4db8ff"
        };

        // ... (هنا ضعي شروط الـ if للحرارة والقير والمكينة اللي سويناها قبل) ...
        if (userText.includes("حرارة")) {
            diag = { title: "حرارة المحرك", problem: "نظام التبريد متعطل", solution: "افحص الرديتر", costMin: 400, costMax: 1500, color: "#ff4d4d" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        // مسح رسالة "جاري التحليل" ووضع النتيجة النهائية "مرة واحدة فقط"
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px;">
                <h2 style="color:${diag.color};">📋 ${diag.title}</h2>
                <p><strong>⚠️ التشخيص:</strong> ${diag.problem}</p>
                <p><strong>🛠️ الحل:</strong> ${diag.solution}</p>
                <div style="margin-top:15px; padding:10px; background:rgba(0,0,0,0.3); border-radius:10px;">
                    <span style="color:${diag.color};">💰 التكلفة: ${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
                </div>
            </div>`;

    } catch (e) {
        resultDiv.innerHTML = "<p>❌ حدث خطأ في الاتصال.</p>";
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}
