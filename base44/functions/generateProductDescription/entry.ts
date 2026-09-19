import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Analyzes the current product image with a vision LLM and generates
// optimized e-commerce listing copy (title, descriptions, keywords, bullets).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const imageUrl = (body?.imageUrl || '').toString().trim();
    if (!imageUrl) return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    const platform = (body?.platform || 'shopify').toString().toLowerCase();
    const context = (body?.context || '').toString().trim().slice(0, 400);

    const platformTone = {
      shopify: 'Shopify product page — clear, benefit-driven, SEO-friendly.',
      amazon: 'Amazon listing — feature-rich, keyword-dense, conversion-focused.',
      instagram: 'Instagram shop — punchy, lifestyle-led, emoji-friendly.',
      etsy: 'Etsy listing — handmade, personal, descriptive.',
    }[platform] || 'e-commerce product page — clear and benefit-driven.';

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt:
        'You are an expert e-commerce copywriter and SEO specialist. ' +
        'Analyze the product in the provided image and write optimized listing copy.\n' +
        'Platform tone: ' + platformTone + '\n' +
        (context ? 'Additional context from the seller: ' + context + '\n' : '') +
        'Rules:\n' +
        '1. Identify the product type, material, color, and key features from the image.\n' +
        '2. Title: compelling, keyword-rich, max 80 characters.\n' +
        '3. shortDescription: 1-2 sentences, max 200 characters.\n' +
        '4. description: 2 paragraphs highlighting features, benefits, and ideal use — plain text, no markdown.\n' +
        '5. keywords: 8-12 SEO search terms a shopper might use.\n' +
        '6. bullets: 4-6 key feature bullet points, each max 100 characters.\n' +
        'Return ONLY JSON matching the schema — no preamble, no markdown fences.',
      file_urls: [imageUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          shortDescription: { type: 'string' },
          description: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' } },
          bullets: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'shortDescription', 'description', 'keywords', 'bullets'],
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}