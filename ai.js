const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للحادث أولاً!");
        return;
    }

    resultDiv.innerHTML = `<p style="color:#4db8ff; text-align:center;">⏳ جاري التحليل بالذكاء الاصطناعي...</p>`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        
        if (data.prediction === "NEGATIVE") {
            resultDiv.innerHTML = `
                <div style="background: rgba(255, 77, 77, 0.1); padding:20px; border-radius:15px; border:1px solid #ff4d4d;">
                    <h3 style="color:#ff4d4d;">🔴 تشخيص: ضرر جسيم</h3>
                    <p style="color:white;">يوجد خطر تقني عالٍ، يرجى فحص المحرك فوراً.</p>
                </div>`;
        } else {
            resultDiv.innerHTML = `
                <div style="background: rgba(77, 184, 255, 0.1); padding:20px; border-radius:15px; border:1px solid #4db8ff;">
                    <h3 style="color:#4db8ff;">🟢 تشخيص: ضرر طفيف</h3>
                    <p style="color:white;">الأضرار تبدو سطحية وبسيطة ولا تعيق حركة السيارة.</p>
                </div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ حدث خطأ في الاتصال بالسيرفر.</p>`;
    }
}
