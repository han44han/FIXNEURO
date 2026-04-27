// جلب معامل السعر من القائمة المنسدلة
const priceMultiplier = parseFloat(document.getElementById('carCategory').value) || 1;

// مصفوفة الأسعار الأساسية (للسيارات الاقتصادية)
let basePrices = {
    heat: { min: 300, max: 1200 },
    engine: { min: 1000, max: 5000 },
    gear: { min: 500, max: 3000 },
    ac: { min: 150, max: 1000 },
    brakes: { min: 150, max: 600 }
};

// مثال: كيف نحسب السعر النهائي داخل الـ If
if (userText.includes("حرارة")) {
    let minFinal = Math.round(basePrices.heat.min * priceMultiplier);
    let maxFinal = Math.round(basePrices.heat.max * priceMultiplier);
    
    diag = {
        title: "مشكلة في نظام التبريد",
        cost: `${minFinal.toLocaleString()} - ${maxFinal.toLocaleString()}`,
        // باقي البيانات...
    };
}
