import { supabase } from './database.js';

const API_BASE_URL = "https://fixneuro-f6k8.onrender.com";
const API_URL_CHECK = "https://fixneuro.onrender.com/check";

/**
 * 1. دالة تحليل النص (المحرك الأول)
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

    if (imageResBox) imageResBox.style.display = 'none';
    resultDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><p style="color:#4db8ff;">⏳ جاري التحليل...</p></div>`;
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
            diag = { title: "منظومة التبريد", problem: "احتمال تهريب ماء.", solution: "افحص الرديتر.", costMin: 400, costMax: 2000, color: "#ff4d4d", status: "pending" };
        } else if (userText.includes("قير") || userText.includes("نتعه")) {
            diag = { title: "ناقل الحركة", problem: "مشكلة في التبديلات.", solution: "افحص زيت القير.", costMin: 600, costMax: 4000, color: "#ff4d4d", status: "pending" };
        }

        const finalMin = Math.round(diag.costMin * multiplier);
        const finalMax = Math.round(diag.costMax * multiplier);

        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:15px; border:2px solid ${diag.color}; margin-top:20px;">
                <h3 style="color:${diag.color};">📋 ${diag.title}</h3>
                <p><strong>المشكلة:</strong> ${diag.problem}</p>
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; text-align:center; margin-top:10px;">
                    <span style="color:#fff;">التكلفة: ${finalMin} - ${finalMax} ريال</span>
                </div>
            </div>`;

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id, title: diag.title, description: diag.problem, status: diag.status, cost: finalMax
            });
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color:#ff4d4d;">❌ فشل الاتصال.</p>`;
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "🔍 شخّص المشكلة الآن"; }
    }
}

/**
 * 2. دالة تشخيص الصور (المحرك الثاني)
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
        imageContent.innerHTML = `<p style="color:#4db8ff;">النتيجة: ${data.prediction || "ضرر مرصود"}</p>`;
        
        const reader = new FileReader();
        reader.onload = (e) => { imageDisplay.src = e.target.result; imageDisplay.style.display = 'block'; };
        reader.readAsDataURL(imageInput.files[0]);
    } catch (error) {
        imageContent.innerText = "❌ فشل تحليل الصورة.";
    }
}

// السطر السحري لربط الدوال بالأزرار (تأكد من وجود هذه الأسطر)
window.startAnalysis = startAnalysis; 
window.diagnoseText = startAnalysis; // هذا السطر يحل مشكلة الـ Uncaught SyntaxError
window.diagnoseImage = diagnoseImage;
