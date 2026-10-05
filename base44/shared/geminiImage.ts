// Calls Google Gemini's image-generation model (gemini-2.5-flash-image, "Nano Banana")
// directly with a user-supplied API key. Accepts a text prompt plus an optional
// reference image (the product photo) so the product is blended into the result.
// Returns a data URI the frontend can load straight into an <img>/canvas.
const GEMINI_MODEL = 'gemini-2.5-flash-image-preview';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function bufferToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function generateImageWithGemini(prompt, productImageUrl, apiKey) {
  if (!apiKey) throw new Error('Gemini API key is required. Add it in the API key settings.');
  if (!prompt) throw new Error('Prompt is required');

  const parts = [{ text: prompt }];

  if (productImageUrl) {
    const imgResp = await fetch(productImageUrl);
    if (!imgResp.ok) throw new Error('Could not fetch product image for Gemini');
    const buf = await imgResp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const b64 = bufferToBase64(bytes);
    const mime = imgResp.headers.get('content-type') || 'image/png';
    parts.push({ inline_data: { mime_type: mime, data: b64 } });
  }

  const resp = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Gemini error ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const candidates = data?.candidates || [];
  let imageB64 = null;
  let imageMime = 'image/png';
  for (const cand of candidates) {
    const cparts = cand?.content?.parts || [];
    for (const p of cparts) {
      const inline = p.inline_data || p.inlineData;
      if (inline?.data) {
        imageB64 = inline.data;
        imageMime = inline.mime_type || inline.mimeType || imageMime;
        break;
      }
    }
    if (imageB64) break;
  }
  if (!imageB64) throw new Error('Gemini returned no image');

  return { url: `data:${imageMime};base64,${imageB64}` };
}