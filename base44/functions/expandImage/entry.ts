import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateImageWithGemini } from '../../shared/geminiImage.ts';
import { secrets } from 'base44:runtime';

// Uncrop / outpainting: takes the current product photo and regenerates it at a
// new aspect ratio, keeping the product the same and extending the surrounding
// scene outward to fill the wider/taller canvas.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const imageUrl = (body?.imageUrl || '').toString().trim();
    if (!imageUrl) return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    const targetW = Math.max(256, Math.min(4096, parseInt(body?.targetW) || 1080));
    const targetH = Math.max(256, Math.min(4096, parseInt(body?.targetH) || 1080));
    const userPrompt = (body?.prompt || '').toString().trim().slice(0, 300);

    const prompt =
      'You are extending (uncropping) an existing product photograph to a new canvas size of ' + targetW + 'x' + targetH + ' pixels. ' +
      'The reference image is the original photo. Generate a NEW image at this wider/taller aspect ratio that keeps the product ' +
      'the SAME size, position, and appearance, and naturally extends the surrounding scene, surface, and background outward ' +
      'to fill the new canvas. Do NOT crop, zoom, rotate, or alter the product itself. Extend the existing lighting, mood, and ' +
      'environment seamlessly with no visible seams. ' +
      (userPrompt ? 'Additional guidance: ' + userPrompt + '. ' : '') +
      'Photorealistic professional product photography, no text, no watermark, no logo. Output only the image.';

    const apiKey = secrets.get('GEMINI_API_KEY');
    const result = await generateImageWithGemini(prompt, imageUrl, apiKey);
    if (!result || !result.url) return Response.json({ error: 'Image generation failed' }, { status: 500 });

    return Response.json({ url: result.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}