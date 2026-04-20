const API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large";
const API_TOKEN = "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"; // حطي التوكن حقك هنا

export async function analyzeImage() {
    const imageInput = document.getElementById('imageInput');
    const resultDiv = document.getElementById('resultItems');
    const loader = document.getElementById('loading');

    if (!imageInput.files[0]) return alert("ارفعي صورة أولاً!");

    loader.style.display = 'block';
    resultDiv.innerHTML = "جاري الفحص...";

    try {
        // الطريقة هذي (Blob مباشرة) هي أسرع وأسهل طريقة يتقبلها المتصفح
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": "Bearer " + API_TOKEN },
            body: imageInput.files[0]
        });

        const result = await response.json();
        loader.style.display = 'none';

        if (response.ok) {
            // الموديل هذا يعطي وصف بالانجليزي، بنحط ترجمة تقريبية بسيطة
            const desc = result[0]?.generated_text || "لم يتم تحديد الضرر بدقة";
            
            resultDiv.innerHTML = `
                <div style="background:#162d52; padding:20px; border-radius:12px; border-right:5px solid #4db8ff;">
                    <h3 style="color:#4db8ff;">🔍 تقرير الذكاء الاصطناعي:</h3>
                    <p style="margin-top:10px; font-size:18px;">النتيجة: ${desc}</p>
                </div>`;
        } else {
            resultDiv.innerHTML = "الموديل يجهز نفسه، اضغطي الزر مرة ثانية بعد 10 ثواني.";
        }
    } catch (e) {
        loader.style.display = 'none';
        resultDiv.innerHTML = "فيه مشكلة بالاتصال، تأكدي إنك مشغلة الإضافة وحاطة Authorization في الإعدادات.";
    }
}