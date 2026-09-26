import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Refines a short user description into a precise, detailed image-generation prompt,
// then generates a photorealistic model/hands scene for product placement.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const description = (body?.description || '').toString().trim();
    if (!description) return Response.json({ error: 'Description is required' }, { status: 400 });
    if (description.length > 600) return Response.json({ error: 'Description too long (max 600)' }, { status: 400 });

    // Step 1: LLM refines the user's description into an exact, detailed image prompt.
    const refine = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt:
        'You are an elite prompt engineer for a photorealistic image generator. ' +
        'Create ONE precise image prompt that generates ONLY a model (hands / arms / body / person) for a product-placement composite. ' +
        'The user\'s REAL product will be inserted into the scene afterward by compositing, so the model image must NOT contain the product.\n' +
        'CRITICAL RULES:\n' +
        '1. NEVER render the product or any object the user says is being held. If the user says "hands holding controllers", "hands holding a phone", or "hands holding a bottle", generate ONLY the hands — the controllers / phone / bottle must NOT appear in the image at all. The user will composite their actual product in later.\n' +
        '2. Pose and shape the hands EXACTLY as if they are gripping the described object — fingers curled around where it would be, thumbs in the right place, palms oriented correctly — but the space the object occupies must be EMPTY (the background shows through the grip). Think "hands holding an invisible object."\n' +
        '3. Capture EVERY detail about the PERSON / hands the user mentioned: number of hands, gender, skin tone, gesture, finger arrangement, nail style, jewelry, clothing, pose, posture, expression, camera framing.\n' +
        '4. Keep the empty grip area clean, centered, and well-lit so a product can be dropped in seamlessly. Do NOT fill it with any object, silhouette of an object, shadow of an object, or reflection of an object — only empty space where the product goes.\n' +
        '5. Style: professional e-commerce product photography, studio lighting, sharp focus, realistic skin texture with natural pores, lifelike colors, ultra high detail, 4k.\n' +
        '6. No text, no watermark, no logo, no brand names on clothing or skin.\n' +
        '7. Output ONLY a single plain prompt string — no preamble, no explanation, no quotes, no bullet points.\n' +
        'User description: ' + description,
      response_json_schema: {
        type: 'object',
        properties: { prompt: { type: 'string' } },
        required: ['prompt'],
      },
    });

    let refined = (refine?.prompt || '').toString();
    // Strip LLM meta-commentary / JSON-closing artifacts that leak into the prompt string.
    const cutIdx = refined.indexOf('"}}');
    if (cutIdx !== -1) refined = refined.slice(0, cutIdx);
    refined = refined.trim() || description;

    // Step 2: generate the image with the refined prompt.
    const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: refined });
    if (!result || !result.url) return Response.json({ error: 'Image generation failed' }, { status: 500 });

    return Response.json({ url: result.url, prompt: refined });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}