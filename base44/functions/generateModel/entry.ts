import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Refines a short user description into a precise image-generation prompt, then
// generates a photorealistic model (hands/body/person) genuinely holding, wearing,
// or displaying the user's ACTUAL product (image-to-image using the product as a
// reference), producing a final composite rather than a backdrop to paste onto.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const description = (body?.description || '').toString().trim();
    if (!description) return Response.json({ error: 'Description is required' }, { status: 400 });
    if (description.length > 600) return Response.json({ error: 'Description too long (max 600)' }, { status: 400 });
    const productImageUrl = (body?.productImageUrl || '').toString().trim();

    // Step 1: LLM refines the description into an exact image prompt.
    const refine = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt:
        'You are an elite prompt engineer for a photorealistic image generator. ' +
        'Create ONE precise image prompt for a product-placement photo. A reference photo of the REAL product is provided. ' +
        'The generated image must show a real person / hands / body genuinely holding, wearing, or displaying THIS exact product — not a stand-in, not an imitation, and not an empty grip.\n' +
        'CRITICAL RULES:\n' +
        '1. The product from the reference photo must appear in the final image EXACTLY as shown — same shape, color, proportions, material, logos, and details. Do not alter, replace, simplify, or invent a different product. The model interacts with THIS product.\n' +
        '2. The model must genuinely hold, wear, or display the product in a natural, physically believable way — fingers actually wrapped around it, body actually wearing it, or hands presenting it. The grip and contact must look real.\n' +
        '3. Capture EVERY detail about the PERSON / hands the user mentioned: number of hands, gender, skin tone, gesture, finger arrangement, nail style, jewelry, clothing, pose, posture, expression, camera framing.\n' +
        '4. Blend the product with the model naturally: matching light direction, correct shadows cast by the product and the hands, color spill between skin and product, realistic scale and perspective. The product must look like it was photographed with the model, not pasted on top.\n' +
        '5. Style: professional e-commerce product photography, studio lighting, sharp focus, realistic skin texture with natural pores, lifelike colors, ultra high detail, 4k.\n' +
        '6. No text, no watermark, no logo, no brand names on clothing or skin (the product\'s own branding is allowed and must be preserved exactly).\n' +
        '7. Output ONLY a single plain prompt string — no preamble, no explanation, no quotes, no bullet points.\n' +
        'User description: ' + description,
      response_json_schema: {
        type: 'object',
        properties: { prompt: { type: 'string' } },
        required: ['prompt'],
      },
    });

    let refined = (refine?.prompt || '').toString();
    const cutIdx = refined.indexOf('"}}');
    if (cutIdx !== -1) refined = refined.slice(0, cutIdx);
    refined = refined.trim() || description;

    // Step 2: generate the final composite, using the product photo as a reference.
    const genArgs = { prompt: refined };
    if (productImageUrl) genArgs.existing_image_urls = [productImageUrl];
    const result = await base44.asServiceRole.integrations.Core.GenerateImage(genArgs);
    if (!result || !result.url) return Response.json({ error: 'Image generation failed' }, { status: 500 });

    return Response.json({ url: result.url, prompt: refined });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}