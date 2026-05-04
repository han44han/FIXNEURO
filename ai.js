import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";
const API_URL_CHECK = "https://fixneuro.onrender.com/check";

/**
 * 1. دالة تحليل النص (المحرك المتطور)
 */
export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription'); // متطابق مع HTML
    const resultDiv = document.getElementById('resultItems');       // متطابق مع HTML
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    // تهيئة الواجهة
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري التحليل... (قد يستغرق 30 ثانية إذا كان السيرفر خاملًا)</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري الفحص..."; }

    try {
        const response = await fetch(API_URL_CHECK, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ text: textInput.value })
        });

        if (!response.ok) throw new Error('CORS or Server Error');

        const data = await response.json();
        const aiStatus = data.prediction || "NEGATIVE"; 
        const userText = textInput.value.toLowerCase();
        const multiplier = parseFloat(carCategory?.value) || 1;

        // محرك التشخيص
        let diag = {
            title: "فحص تقني عام",
            problem: "خلل فني يتطلب فحص كمبيوتر دقيق.",
            solution: "يرجى زيارة أقرب مركز صيانة للفحص الفيزيائي.",
            costMin: 150, costMax: 400,
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff",
            status: aiStatus === "NEGATIVE" ? "pending" : "completed"
        };

        if (userText.includes("حرارة") || userText.includes("ترتفع")) {
            diag = { title: "منظومة التبريد", problem: "احتمال تهريب ماء أو عطل مراوح.", solution: "افحص الرديتر فوراً وتجنب القيادة.", costMin: 400, costMax: 2000, color: "#ff4d4d", status: "pending" };
        } else if (userText.includes("طقطقه") || userText.includes("صوت") || userText.includes("مكينة")) {
            diag = { title: "ميكانيكا المحرك", problem: "خلل داخلي أو نقص في ضغط الزيت.", solution: "افحص مستوى الزيت وطرمبة الزيت.", costMin: 1500, costMax: 7000, color: "#ff4d4d", status: "pending" };
        } else if (userText.includes("قير") || userText.includes("نتعه")) {
            diag = { title: "ناقل الحركة", problem: "اتساخ زيت القير أو عطل حساسات.", solution: "افحص زيت القير والفلتر بالكمبيوتر.", costMin: 600, costMax: 4000, color: "#ff4d4d", status: "pending" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding:20px; border-radius:15px; border:2px solid ${diag.color}; animation: fadeIn 0.5s;">
                <h3 style="color:${diag.color}; margin-bottom:10px;">📋 ${diag.title}</h3>
                <p><strong>المشكلة:</strong> ${diag.problem}</p>
                <p><strong>الحل:</strong> ${diag.solution}</p>
                <div style="background:rgba(0,0,0,0.4); padding:10px; border-radius:8px; text-align:center; margin-top:15px;">
                    <span style="color:#fff; font-weight:bold;">التكلفة التقديرية: ${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
                </div>
            </div>`;

        // الحفظ في Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id, title: diag.title, description: diag.problem, status: diag.status, cost: finalMax
            });
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        resultDiv.innerHTML = `
            <div style="color:#ff4d4d; text-align:center; padding:15px; background:rgba(255,77,77,0.1); border-radius:10px;">
                <p>❌ عذراً، تعذر الاتصال بمحرك الذكاء الاصطناعي حالياً.</p>
                <small style="display:block; margin-top:5px;">تأكد من تفعيل الـ CORS في السيرفر أو المحاولة لاحقاً.</small>
            </div>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "شخّص المشكلة الآن"; }
    }
}

/**
 * 2. دالة تشخيص الصور
 */
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
    imageContent.innerHTML = "⏳ جاري فحص الصورة...";

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        imageContent.innerHTML = `
            <h3 style="color:#4db8ff;">نتيجة الفحص البصري:</h3>
            <p>${data.prediction || data.class || "ضرر خارجي مرصود"}</p>
        `;
        
        const reader = new FileReader();
        reader.onload = (e) => { imageDisplay.src = e.target.result; imageDisplay.style.display = 'block'; };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ فشل تحليل الصورة.";
    }
}

// التصدير العالمي للأزرار
window.startAnalysis = startAnalysis;
window.diagnoseText = startAnalysis;
window.diagnoseImage = diagnoseImage;
