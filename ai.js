// 1. استيراد مكتبة TensorFlow.js (تأكدي من وجودها في ملف index.html)
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>

export async function startAnalysis() {
    const imageInput = document.getElementById('carImage');
    const resultDiv = document.getElementById('resultItems');

    if (!imageInput.files[0]) return;

    resultDiv.innerHTML = "⏳ جاري تحميل عصبونات المودل (Deep Learning)...";

    try {
        // 2. تحميل المودل الحقيقي (المخ)
        // ملاحظة: يجب تحويل ملف .pth إلى tfjs format أولاً
        const model = await tf.loadLayersModel('./model/model.json');

        // 3. معالجة الصورة لتناسب المودل (Preprocessing)
        const imgElement = document.createElement('img');
        imgElement.src = URL.createObjectURL(imageInput.files[0]);
        
        imgElement.onload = async () => {
            const tensor = tf.browser.fromPixels(imgElement)
                .resizeNearestNeighbor([224, 224]) // الأبعاد التي تدرب عليها المودل
                .toFloat()
                .expandDims();

            // 4. التنبؤ الحقيقي (Inference)
            const prediction = await model.predict(tensor).data();
            
            // الحصول على أعلى نتيجة (الفئة المكتشفة)
            const classId = prediction.indexOf(Math.max(...prediction));

            // 5. عرض النتيجة بناءً على فئاتكم الـ 4
            let result = {};
            if (classId === 1) { // مثال: فئة الأبواب
                result = { loc: "الأبواب الجانبية", color: "#ff4d4d", cost: "5000-11000" };
            } else {
                result = { loc: "مقدمة المركبة", color: "#ffc107", cost: "1500-4000" };
            }

            resultDiv.innerHTML = `
                <div style="border: 2px solid ${result.color}; padding: 15px; border-radius: 10px;">
                    <h3 style="color:${result.color};">📍 الموقع الحقيقي المكتشف: ${result.loc}</h3>
                    <p>تم التحليل عبر Neural Network بنجاح.</p>
                    <p>التكلفة: ${result.cost} ريال</p>
                </div>`;
        };
    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = "❌ خطأ في تحميل ملفات المودل .json";
    }
}
