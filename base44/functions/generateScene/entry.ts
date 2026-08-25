import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Refines a short user description into a precise, detailed image-generation prompt,
// then generates a photorealistic scene/backdrop for product placement.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const prompt = (body?.prompt || '').toString().trim();
    if (!prompt) return Response.json({ error: 'Prompt is required' }, { status: 400 });
    if (prompt.length > 500) return Response.json({ error: 'Prompt too long (max 500)' }, { status: 400 });

    // Step 1: LLM refines the user's description into an exact, detailed image prompt.
    const refine = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt:
        'You are an elite prompt engineer for a photorealistic image generator. ' +
        'Convert the user\'s description of a scene or backdrop for a product photography composite into ONE precise, self-contained image prompt.\n' +
        'Rules:\n' +
        '1. Capture EVERY detail the user mentioned exactly as intended — do not omit, reinterpret, simplify, or add unrelated elements.\n' +
        '2. Describe the scene concretely and vividly: environment, surface texture, background elements, props, lighting direction and quality, mood, color palette, atmosphere, depth of field, camera angle.\n' +
        '3. The scene must be suitable for compositing a product into it later: leave a natural, clean, empty area where the product will sit (e.g. a clear surface, open space, unobstructed foreground).\n' +
        '4. Style: professional e-commerce product photography, studio-quality or natural lighting as appropriate, sharp focus, photorealistic, ultra high detail, 4k.\n' +
        '5. No text, no watermark, no logo, no brand names, no people unless the user explicitly requests them.\n' +
        '6. Output ONLY a single plain prompt string — no preamble, no explanation, no quotes, no bullet points.\n' +
        'User description: ' + prompt,
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
    refined = refined.trim() || prompt;

    // Step 2: generate the image with the refined prompt.
    const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: refined });
    if (!result || !result.url) return Response.json({ error: 'Image generation failed' }, { status: 500 });

    return Response.json({ url: result.url, prompt: refined });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}