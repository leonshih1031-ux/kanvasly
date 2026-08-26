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
        'Convert the user\'s description of a model / hands / body for a product photography composite into ONE precise, self-contained image prompt.\n' +
        'Rules:\n' +
        '1. CRITICAL — Every object, item, and prop the user mentions MUST appear in the generated image. If the user says "hands holding controllers", the controllers MUST be in the image. If the user says "hands holding a phone", the phone MUST be in the image. Never remove, omit, or replace any object the user explicitly describes — even if you think it is a "product" that might be composited later. The user will composite a DIFFERENT product onto this image, so every object they describe is part of the scene and must be rendered.\n' +
        '2. Capture EVERY detail the user mentioned exactly as intended — do not omit, reinterpret, simplify, or add unrelated elements. If the user specifies a quantity (e.g. "two hands"), a gender, a skin tone, a gesture, a pose, nail style, jewelry, or clothing, include each one explicitly.\n' +
        '3. Describe the person/hands concretely and vividly: exact skin tone, hand position, finger arrangement, gesture, pose, posture, clothing, expression, camera framing, and the spatial relationship between hands/body and any objects they are holding or interacting with.\n' +
        '4. Only leave an empty/natural area for product compositing if the user did NOT specify what the hands are holding. If the user described specific objects being held, render those objects fully — the product will be composited nearby or on top of them.\n' +
        '5. Style: professional e-commerce product photography, studio lighting, sharp focus, realistic skin texture with natural pores and imperfections, lifelike colors, ultra high detail, 4k.\n' +
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