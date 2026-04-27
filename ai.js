const API_URL = "http://127.0.0.1:5000/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للحادث أولاً!");
        return;
    }

    resultDiv.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <p style="color:#4db8ff; font-size:18px;">⏳ جاري تحليل التقرير بالذكاء الاصطناعي...</p>
        </div>`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        
        // التنسيق الجمالي للنتيجة
        if (data.prediction === "NEGATIVE") {
            resultDiv.innerHTML = `
                <div style="background: rgba(255, 77, 77, 0.1); padding:25px; border-radius:20px; border:2px solid #ff4d4d; margin-top:20px; box-shadow: 0 0 15px rgba(255, 77, 77, 0.3);">
                    <h3 style="color:#ff4d4d; margin-bottom:10px; display:flex; align-items:center; gap:10px;">🔴 تشخيص: ضرر جسيم (Critical)</h3>
                    <p style="color:white; line-height:1.6; font-size:16px;">التحليل الذكي يشير إلى وجود خطر تقني عالي. الوصف يحتوي على مؤشرات لضرر في المحرك أو الهيكل الأساسي. يرجى نقل المركبة برافعة فوراً.</p>
                </div>`;
        } else {
            resultDiv.innerHTML = `
                <div style="background: rgba(77, 184, 255, 0.1); padding:25px; border-radius:20px; border:2px solid #4db8ff; margin-top:20px; box-shadow: 0 0 15px rgba(77, 184, 255, 0.3);">
                    <h3 style="color:#4db8ff; margin-bottom:10px; display:flex; align-items:center; gap:10px;">🟢 تشخيص: ضرر طفيف (Minor)</h3>
                    <p style="color:white; line-height:1.6; font-size:16px;">بناءً على الوصف، الأضرار تبدو سطحية (خدوش أو صدمات خفيفة). السيارة صالحة للسير ويمكن إصلاحها في ورش السمكرة العادية.</p>
                </div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال بالسيرفر. تأكدي من تشغيل app.py</p>`;
    }
}
