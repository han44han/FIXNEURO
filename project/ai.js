const API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large";
const API_TOKEN = "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";

export async function analyzeImage() {
    const imageInput = document.getElementById('imageInput');
    const resultDiv = document.getElementById('resultItems');
    const loader = document.getElementById('loading');

    if (!imageInput.files[0]) return alert("ارفعي صورة أولاً!");

    loader.style.display = 'block';
    resultDiv.innerHTML = "⏳ جاري التحليل الآن...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                // حذفنا أي Headers ثانوية ممكن تسبب مشاكل CORS
                "Authorization": `Bearer ${API_TOKEN}` 
            },
            body: imageInput.files[0]
        });

        const result = await response.json();
        loader.style.display = 'none';

        if (response.ok) {
            // الموديل هذا بيرجع وصف للصورة
            const description = result[0]?.generated_text || "تم فحص الصورة بنجاح";
            resultDiv.innerHTML = `
                <div style="background:#162d52; padding:20px; border-radius:12px; border-right:5px solid #4db8ff;">
                    <h4 style="color:#4db8ff;">🔍 نتيجة الفحص:</h4>
                    <p style="font-size:18px;">${description}</p>
                </div>`;
        } else {
            // إذا السيرفر لسه بيجهز نفسه (تصير كثير في Hugging Face)
            resultDiv.innerHTML = "⚠️ السيرفر يستعد، انتظري 10 ثواني واضغطي الزر مرة ثانية.";
        }
    } catch (e) {
        loader.style.display = 'none';
        resultDiv.innerHTML = "❌ فشل في الاتصال. جربي مرة أخرى بعد لحظات.";
        console.error(e);
    }
}
