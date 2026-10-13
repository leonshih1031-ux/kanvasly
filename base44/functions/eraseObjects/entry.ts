import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateImageWithGemini } from '../../shared/geminiImage.ts';
import { secrets } from 'base44:runtime';

// Magic eraser: the input image has bright green brush strokes painted over the
// objects/blemishes/people the user wants removed. Gemini regenerates the image
// with those areas cleaned and reconstructed from the surrounding background.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const markedImageUrl = (body?.markedImageUrl || '').toString().trim();
    if (!markedImageUrl) return Response.json({ error: 'markedImageUrl is required' }, { status: 400 });

    const prompt =
      'The reference image has bright green brush marks painted over objects, blemishes, people, or logos that should be removed. ' +
      'Remove EVERYTHING covered by the green marks and reconstruct those areas naturally using the surrounding background, ' +
      'lighting, and textures, so the result looks clean and seamless. Keep all unmarked areas exactly the same. ' +
      'Leave no green residue. Photorealistic, no text, no watermark. Output only the cleaned image.';

    const apiKey = secrets.get('GEMINI_API_KEY');
    const result = await generateImageWithGemini(prompt, markedImageUrl, apiKey);
    if (!result || !result.url) return Response.json({ error: 'Image generation failed' }, { status: 500 });

    return Response.json({ url: result.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}