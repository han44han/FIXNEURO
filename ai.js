export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة أولاً");
        return;
    }

    imageResBox.style.display = 'block';
    imageContent.innerHTML = `<div style="text-align:center; padding:10px;"><p style="color:#4db8ff;">🔍 جاري تحليل الصورة عبر الذكاء الاصطناعي...</p></div>`;
    imageDisplay.style.display = 'none';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();
        // الحصول على النتيجة الخام من الموديل
        const rawPrediction = data.prediction || data.class || "لم يتم تحديد النتيجة";
        
        // تحويلها لنص صغير للفحص
        let predictionLower = rawPrediction.toLowerCase();
        
        // تحديد الحالة: هل يوجد ضرر؟
        // سنعتبر أي نتيجة لا تحتوي على كلمة "سليم" أو "clean" أو "no damage" هي احتمال ضرر
        const isSafe = predictionLower.includes("clean") || 
                       predictionLower.includes("no damage") || 
                       predictionLower.includes("no_damage") ||
                       predictionLower.includes("سليم");

        let statusColor = isSafe ? "#2ecc71" : "#ff4d4d"; // أخضر للسليم، أحمر للضرر
        let statusIcon = isSafe ? "✅" : "⚠️";
        let statusTitle = isSafe ? "السيارة سليمة" : "تم رصد ضرر";

        imageContent.innerHTML = `
            <div style="padding:15px; border-radius:12px; background:rgba(255,255,255,0.05); border:2px solid ${statusColor};">
                <h3 style="color:${statusColor}; margin-bottom:8px;">📍 نتيجة الفحص البصري:</h3>
                <p style="font-size:18px; font-weight:bold;">${statusIcon} ${rawPrediction}</p>
                <p style="font-size:13px; color:#aaa; margin-top:10px;">* تم تحليل هذه النتيجة بناءً على الرؤية الحاسوبية للهيكل الخارجي.</p>
            </div>`;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
        };
        reader.readAsDataURL(imageInput.files[0]);

    } catch (error) {
        console.error("Error:", error);
        imageContent.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال بالسيرفر. تأكدي من تشغيل خدمة الـ API.</p>`;
    }
}
