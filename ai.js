import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";
const API_URL_CHECK = "https://fixneuro.onrender.com/check";

// --- دالة تشخيص النص ---
export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');
    const btn = document.getElementById('mainBtn');
    const carCategory = document.getElementById('carCategory');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للعطل أولاً!");
        return;
    }

    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري التحليل المختصر...</p></div>`;
    if(btn) { btn.disabled = true; btn.innerText = "جاري الفحص..."; }

    try {
        const response = await fetch(API_URL_CHECK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const aiStatus = data.prediction || "غير محدد"; 
        const userText = textInput.value.toLowerCase();
        const multiplier = parseFloat(carCategory?.value) || 1;

        let diag = {
            title: "فحص تقني",
            problem: "خلل يحتاج فحص كمبيوتر.",
            solution: "توجه لأقرب مركز صيانة.",
            costMin: 150, costMax: 400,
            color: aiStatus === "NEGATIVE" ? "#ff4d4d" : "#4db8ff",
            status: aiStatus === "NEGATIVE" ? "pending" : "completed"
        };

        // محرك الكلمات المفتاحية
        if (userText.includes("حرارة") || userText.includes("ترتفع")) {
            diag = { title: "منظومة التبريد", problem: "احتمال تهريب ماء أو عطل مراوح.", solution: "افحص الرديتر فوراً.", costMin: 400, costMax: 2000, color: "#ff4d4d", status: "pending" };
        } else if (userText.includes("طقطقه") || userText.includes("صوت") || userText.includes("مكينة")) {
            diag = { title: "ميكانيكا المحرك", problem: "خلل داخلي أو نقص زيت.", solution: "افحص مستوى الزيت.", costMin: 1500, costMax: 7000, color: "#ff4d4d", status: "pending" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px;">
                <h3 style="color:${diag.color}; margin:0;">📋 ${diag.title}</h3>
                <p style="margin: 10px 0;"><strong>المشكلة:</strong> ${diag.problem}</p>
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; text-align:center;">
                    <span style="color:#fff; font-weight:bold;">التكلفة: ${finalMin.toLocaleString()} - ${finalMax.toLocaleString()} ريال</span>
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
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ فشل الاتصال.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "شخّص المشكلة الآن"; }
    }
}

// --- دالة تشخيص الصور ---
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
        const response = await fetch(`${API_BASE_URL}/predict`, { method: "POST", body: formData });
        const data = await response.json();
        imageContent.innerHTML = `<h3 style="color:#4db8ff;">نتيجة الفحص البصري:</h3><p>${data.prediction || "ضرر خارجي"}</p>`;
        
        const reader = new FileReader();
        reader.onload = (e) => { imageDisplay.src = e.target.result; imageDisplay.style.display = 'block'; };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ فشل تحليل الصورة.";
    }
}

// التصدير للنافذة العالمية لضمان عمل الأزرار
window.startAnalysis = startAnalysis;
window.diagnoseText = startAnalysis; // لحل مشكلة الاسم القديم
window.diagnoseImage = diagnoseImage;
