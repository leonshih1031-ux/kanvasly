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
      prompt:
        'You are an expert prompt engineer for a photorealistic image generator. ' +
        'Convert the user\'s description of a model / hands / body for a product photography composite into ONE precise, self-contained image prompt. ' +
        'Rules:\n' +
        '- Capture EVERY detail the user mentioned exactly as intended; do not omit, reinterpret, or add unrelated elements.\n' +
        '- Describe the person/hands concretely: skin tone, hand position, fingers, gesture, pose, clothing, expression, camera framing.\n' +
        '- Keep it suitable for compositing a product onto the model later: leave a natural empty area where the product will sit (e.g. open palms, held object, worn area).\n' +
        '- Style: professional e-commerce product photography, studio lighting, sharp focus, realistic skin texture, high detail, no text, no watermark, no logo.\n' +
        '- Output a single plain prompt string, no preamble, no quotes.\n' +
        'User description: ' + description,
      response_json_schema: {
        type: 'object',
        properties: { prompt: { type: 'string' } },
        required: ['prompt'],
      },
    });

    const refined = (refine?.prompt || '').toString().trim() || description;

    // Step 2: generate the image with the refined prompt.
    const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: refined });
    if (!result || !result.url) return Response.json({ error: 'Image generation failed' }, { status: 500 });

    return Response.json({ url: result.url, prompt: refined });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}