// الرابط الصحيح لسيرفر Render مع المسار /check
const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');

    // التحقق من وجود النص
    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للحادث أولاً!");
        return;
    }

    // إظهار حالة التحميل
    resultDiv.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <p style="color:#4db8ff; font-size:18px; animation: pulse 1.5s infinite;">⏳ جاري تحليل التقرير بالذكاء الاصطناعي...</p>
        </div>`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ text: textInput.value })
        });

        if (!response.ok) {
            throw new Error('السيرفر لا يستجيب حالياً');
        }

        const data = await response.json();
        
        // عرض النتيجة بناءً على توقع الموديل (NEGATIVE = ضرر جسيم)
        if (data.prediction === "NEGATIVE") {
            resultDiv.innerHTML = `
                <div style="background: rgba(255, 77, 77, 0.1); padding:25px; border-radius:20px; border:2px solid #ff4d4d; margin-top:20px; box-shadow: 0 0 15px rgba(255, 77, 77, 0.3);">
                    <h3 style="color:#ff4d4d; margin-bottom:10px; display:flex; align-items:center; gap:10px;">🔴 تشخيص: ضرر جسيم (Critical)</h3>
                    <p style="color:white; line-height:1.6; font-size:16px;">التحليل الذكي يشير إلى وجود خطر تقني عالي. الوصف يحتوي على مؤشرات لضرر في المحرك أو الهيكل الأساسي. يرجى نقل المركبة برافعة فوراً وعدم تشغيلها.</p>
                </div>`;
        } else {
            resultDiv.innerHTML = `
                <div style="background: rgba(77, 184, 255, 0.1); padding:25px; border-radius:20px; border:2px solid #4db8ff; margin-top:20px; box-shadow: 0 0 15px rgba(77, 184, 255, 0.3);">
                    <h3 style="color:#4db8ff; margin-bottom:10px; display:flex; align-items:center; gap:10px;">🟢 تشخيص: ضرر طفيف (Minor)</h3>
                    <p style="color:white; line-height:1.6; font-size:16px;">بناءً على الوصف، الأضرار تبدو سطحية أو بسيطة (خدوش أو أصوات غير مقلقة). السيارة صالحة للسير ويمكن إصلاحها في مراكز الصيانة الدورية.</p>
                </div>`;
        }
    } catch (error) {
        console.error("Error:", error);
        resultDiv.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.05); padding:20px; border-radius:15px; text-align:center; border: 1px solid rgba(255,255,255,0.1);">
                <p style="color:#ff4d4d;">❌ فشل الاتصال بالسيرفر السحابي.</p>
                <p style="font-size:12px; color:#888; margin-top:5px;">تأكدي من أن خدمة Render في حالة Live</p>
            </div>`;
    }
}
