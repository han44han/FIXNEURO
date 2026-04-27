import { supabase } from './database.js'; // أضفنا استيراد قاعدة البيانات

const API_URL = "https://fixneuro.onrender.com/check";

export async function startAnalysis() {
    const textInput = document.getElementById('accidentDescription');
    const resultDiv = document.getElementById('resultItems');

    if (!textInput || !textInput.value.trim()) {
        alert("يرجى كتابة وصف للحادث أولاً!");
        return;
    }

    resultDiv.innerHTML = `<p style="color:#4db8ff; text-align:center;">⏳ جاري التحليل والحفظ...</p>`;

    try {
        // 1. طلب التشخيص من الذكاء الاصطناعي
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await response.json();
        const isSevere = data.prediction === "NEGATIVE";
        const diagnosisTitle = isSevere ? "ضرر جسيم (Critical)" : "ضرر طفيف (Minor)";
        
        // 2. عرض النتيجة للمستخدم
        renderResult(isSevere, resultDiv);

        // 3. حفظ التقرير في Supabase تلقائياً
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('maintenance_reports').insert({
                user_id: session.user.id,
                title: "تشخيص ذكي: " + diagnosisTitle,
                description: textInput.value,
                status: isSevere ? 'pending' : 'completed',
                cost: isSevere ? 5000 : 200 // مجرد رقم تقديري
            });
            console.log("✅ تم حفظ التقرير بنجاح");
        }

    } catch (error) {
        console.error("Error:", error);
        resultDiv.innerHTML = `<p style="color:#ff4d4d; text-align:center;">❌ حدث خطأ في التشخيص أو الحفظ.</p>`;
    }
}

function renderResult(isSevere, resultDiv) {
    if (isSevere) {
        resultDiv.innerHTML = `
            <div style="background: rgba(255, 77, 77, 0.1); padding:20px; border-radius:15px; border:2px solid #ff4d4d; margin-top:20px;">
                <h3 style="color:#ff4d4d;">🔴 تشخيص: ضرر جسيم</h3>
                <p style="color:white;">تم اكتشاف مشكلة كبيرة. التقرير حُفظ في حسابك.</p>
            </div>`;
    } else {
        resultDiv.innerHTML = `
            <div style="background: rgba(77, 184, 255, 0.1); padding:20px; border-radius:15px; border:2px solid #4db8ff; margin-top:20px;">
                <h3 style="color:#4db8ff;">🟢 تشخيص: ضرر طفيف</h3>
                <p style="color:white;">الأضرار بسيطة. التقرير حُفظ في حسابك.</p>
            </div>`;
    }
}
