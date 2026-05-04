import { supabase } from './database.js';

// استخدام الرابط الأساسي الموحد
const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";
const API_URL_CHECK = "https://fixneuro.onrender.com/check";

/**
 * 1. دالة تحليل النص (المحرك المتطور مع التكلفة و Supabase)
 */
export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');
    const imageResBox = document.getElementById('image-result-box');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    // إخفاء نتائج الصور عند بدء تشخيص النص
    if (imageResBox) imageResBox.style.display = 'none';

    // 1. تصفير النتيجة القديمة وتعطيل الزر
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري التحليل المختصر...</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري الفحص..."; }

    try {
        const response = await fetch(API_URL_CHECK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const aiStatus = data.prediction; 
        const userText = textInput.value.toLowerCase();
        const multiplier = parseFloat(carCategory?.value) || 1;

        // 2. محرك التشخيص المختصر
        let diag = {
            title: "فحص تقني",
            problem: "خلل يحتاج فحص كمبيوتر.",
            solution: "توجه لأقرب مركز صيانة.",
            costMin: 150, costMax: 400,
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff",
            status: aiStatus === "NEGATIVE" ? "pending" : "completed"
        };

        // فحص الكلمات المفتاحية
        if (userText.includes("حرارة") || userText.includes("ترتفع")) {
            diag = { title: "منظومة التبريد", problem: "احتمال تهريب ماء أو عطل مراوح.", solution: "افحص الرديتر فوراً وتجنب القيادة.", costMin: 400, costMax: 2000, color: "#ff4d4d", status: "pending" };
        } else if (userText.includes("طقطقه") || userText.includes("صوت") || userText.includes("مكينة")) {
            diag = { title: "ميكانيكا المحرك", problem: "خلل داخلي أو نقص في ضغط الزيت.", solution: "افحص مستوى الزيت وطرمبة الزيت.", costMin: 1500, costMax: 7000, color: "#ff4d4d", status: "pending" };
        } else if (userText.includes("قير") || userText.includes("نتعه")) {
            diag = { title: "ناقل الحركة", problem: "اتساخ زيت القير أو عطل حساسات.", solution: "افحص زيت القير والفلتر بالكمبيوتر.", costMin: 600, costMax: 4000, color: "#ff4d4d", status: "pending" };
        } else if (userText.includes("مكيف") || userText.includes("حر")) {
            diag = { title: "نظام التكييف", problem: "نقص فريون أو اتساخ الفلتر.", solution: "فحص التهريب وتنظيف الفلتر.", costMin: 200, costMax: 1500, color: "#4db8ff", status: "completed" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        // 3. عرض النتيجة النهائية
        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <h3 style="color:${diag.color}; margin:0;">📋 ${diag.title}</h3>
                    <span style="font-size:12px; color:${diag.color}; border:1px solid; padding:2px 8px; border-radius:5px;">AI: ${aiStatus}</span>
                </div>
                <p style="font-size:14px; margin-bottom:5px;"><strong>المشكلة:</strong> ${diag.problem}</p>
                <p style="font-size:14px; margin-bottom:15px;"><strong>الحل:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; text-align:center;">
                    <span style="color:#fff; font-weight:bold;">التكلفة التقديرية: ${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
                </div>
            </div>`;

        // 4. الحفظ في Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: diag.title,
                description: diag.problem,
                status: diag.status,
                cost: finalMax
            });
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال بالسيرفر.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}

/**
 * 2. دالة تشخيص الصور (المدمجة من الكود الثاني)
 */
export async function diagnoseImage() {
    const imageInput = document.getElementById('image-input');
    const imageResBox = document.getElementById('image-result-box');
    const imageContent = document.getElementById('image-res-content');
    const imageDisplay = document.getElementById('image-res-display');
    const textResDiv = document.getElementById('resultItems');

    if (!imageInput || !imageInput.files[0]) {
        alert("يرجى رفع صورة أولاً");
        return;
    }

    // إخفاء نتائج النصوص عند بدء تشخيص الصورة
    if (textResDiv) textResDiv.innerHTML = '';

    imageResBox.style.display = 'block';
    imageContent.innerHTML = "⏳ جاري فحص الصورة...";
    imageDisplay.style.display = 'none';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        const prediction = data.prediction || data.class || "ضرر خارجي مرصود";

        imageContent.innerHTML = `
            <div style="padding:10px; border-right:4px solid #4db8ff; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <h3 style="color:#4db8ff; margin-bottom:8px;">🔍 نتيجة الفحص البصري:</h3>
                <p style="color:#fff;">${prediction}</p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            imageDisplay.style.display = 'block';
            imageDisplay.style.maxWidth = '100%';
            imageDisplay.style.borderRadius = '10px';
            imageDisplay.style.marginTop = '10px';
        };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ فشل تحليل الصورة.";
    }
}

// جعل الدوال متاحة عالمياً للأزرار في HTML
window.startAnalysis = startAnalysis;
window.diagnoseImage = diagnoseImage;
