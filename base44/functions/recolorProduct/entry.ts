import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateImageWithGemini } from '../../shared/geminiImage.ts';
import { secrets } from 'base44:runtime';

// Recolors the user's actual product to a target color using Gemini image-to-image.
// The product photo is passed as a reference so shape, proportions, logos and
// details are preserved — only the color/finish changes.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const productImageUrl = (body?.productImageUrl || '').toString().trim();
    if (!productImageUrl) return Response.json({ error: 'Product image is required' }, { status: 400 });
    const targetColor = (body?.targetColor || '').toString().trim();
    if (!targetColor) return Response.json({ error: 'Target color is required' }, { status: 400 });
    if (targetColor.length > 120) return Response.json({ error: 'Color description too long (max 120)' }, { status: 400 });

    // Refine the target color into a precise recolor prompt.
    const refine = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt:
        'You are an elite prompt engineer for a photorealistic image generator. ' +
        'Create ONE precise image prompt that recolors a product. A reference photo of the REAL product is provided.\n' +
        'CRITICAL RULES:\n' +
        '1. The product from the reference photo must appear EXACTLY the same — identical shape, size, proportions, material texture, logos, labels, and every detail. ONLY the color and surface finish change to the requested target.\n' +
        '2. Do not alter the product\'s form, add or remove parts, or change the background. The recolor must look like the same product manufactured in the new color.\n' +
        '3. Preserve realistic material properties: if it is glossy keep it glossy, if matte keep matte, with accurate specular highlights and reflections in the new color.\n' +
        '4. Keep lighting and shadows consistent with the original photo.\n' +
        '5. No text, no watermark, no extra objects.\n' +
        '6. Output ONLY a single plain prompt string — no preamble, no explanation, no quotes.\n' +
        'Target color/finish: ' + targetColor,
      response_json_schema: {
        type: 'object',
        properties: { prompt: { type: 'string' } },
        required: ['prompt'],
      },
    });

    let refined = (refine?.prompt || '').toString();
    const cutIdx = refined.indexOf('"}}');
    if (cutIdx !== -1) refined = refined.slice(0, cutIdx);
    refined = refined.trim() || `Recolor this product to ${targetColor}, keeping identical shape, material texture, logos and details, only changing the color, photorealistic product photography`;

    const apiKey = secrets.get('GEMINI_API_KEY');
    const result = await generateImageWithGemini(refined, productImageUrl, apiKey);
    if (!result || !result.url) return Response.json({ error: 'Recolor failed' }, { status: 500 });

    return Response.json({ url: result.url, prompt: refined });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}