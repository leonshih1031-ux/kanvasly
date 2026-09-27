import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Refines a short user description into a precise image-generation prompt, then
// generates a photorealistic scene with the user's ACTUAL product blended into it
// (image-to-image using the product as a reference), so the result is a final
// composite — not a backdrop to paste onto.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const prompt = (body?.prompt || '').toString().trim();
    if (!prompt) return Response.json({ error: 'Prompt is required' }, { status: 400 });
    if (prompt.length > 500) return Response.json({ error: 'Prompt too long (max 500)' }, { status: 400 });
    const productImageUrl = (body?.productImageUrl || '').toString().trim();

    // Step 1: LLM refines the description into an exact image prompt that blends the product in.
    const refine = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt:
        'You are an elite prompt engineer for a photorealistic image generator. ' +
        'Convert the user\'s description of a scene for a product photography composite into ONE precise, self-contained image prompt.\n' +
        'A reference photo of the REAL product is provided. The generated image must contain THIS exact product, placed naturally into the described scene — not pasted on top, but genuinely blended as if it was photographed there.\n' +
        'Rules:\n' +
        '1. The product from the reference photo must appear in the final image EXACTLY as shown — same shape, color, proportions, material, and details. Do not alter, replace, or invent a different product.\n' +
        '2. Capture EVERY detail of the scene the user described: environment, surface, background elements, props, lighting direction and quality, mood, color palette, atmosphere, depth of field, camera angle.\n' +
        '3. Blend the product so it genuinely belongs in the scene: matching light direction, a correct contact shadow on the surface, color reflections from the environment onto the product, and realistic scale and perspective. The product must look like it was photographed in that scene, not composited on top of it.\n' +
        '4. Keep the product as the clear focal point, naturally positioned (e.g. resting on the described surface, centered, well-lit).\n' +
        '5. Style: professional e-commerce product photography, studio-quality or natural lighting as appropriate, sharp focus, photorealistic, ultra high detail, 4k.\n' +
        '6. No text, no watermark, no logo, no brand names. No people unless the user explicitly requests them.\n' +
        '7. Output ONLY a single plain prompt string — no preamble, no explanation, no quotes, no bullet points.\n' +
        'User description: ' + prompt,
      response_json_schema: {
        type: 'object',
        properties: { prompt: { type: 'string' } },
        required: ['prompt'],
      },
    });

    let refined = (refine?.prompt || '').toString();
    const cutIdx = refined.indexOf('"}}');
    if (cutIdx !== -1) refined = refined.slice(0, cutIdx);
    refined = refined.trim() || prompt;

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