export async function diagnoseByText(problem) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_ANTHROPIC_KEY',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `أنت خبير في تشخيص أعطال السيارات. المستخدم يصف المشكلة التالية: "${problem}". أعطِ تشخيصاً واضحاً ومختصراً باللغة العربية يشمل: السبب المحتمل، درجة الخطورة، والتوصية.`
      }]
    })
  })
  const data = await response.json()
  return data.content[0].text
}

export async function diagnoseByImage(imageBase64) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_ANTHROPIC_KEY',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: 'أنت خبير في تشخيص أعطال السيارات. حلل هذه الصورة وأعطِ تشخيصاً واضحاً باللغة العربية يشمل: المشكلة المرئية، السبب المحتمل، درجة الخطورة، والتوصية.' }
        ]
      }]
    })
  })
  const data = await response.json()
  return data.content[0].text
}
