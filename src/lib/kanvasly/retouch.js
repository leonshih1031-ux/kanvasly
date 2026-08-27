// Product-specific retouching tools — replaces the old portrait retouch
// (skin smoothing, teeth whitening, blemish removal) which was misplaced
// in a product photography app.

import { clamp } from "./utils";

// Dust removal: detects small bright/dark anomalies in low-contrast areas
// and replaces them with the surrounding median color.
function removeDust(ctx, w, h) {
  const src = ctx.getImageData(0, 0, w, h);
  const data = src.data;
  const out = new Uint8ClampedArray(data);
  const radius = 2;

  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = (r + g + b) / 3;

      // Collect neighbors for median + local contrast.
      const vals = [];
      let contrastSum = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ni = ((y + dy) * w + (x + dx)) * 4;
          const nlum = (data[ni] + data[ni + 1] + data[ni + 2]) / 3;
          vals.push(nlum);
          contrastSum += Math.abs(nlum - lum);
        }
      }
      vals.sort((a, b) => a - b);
      const median = vals[Math.floor(vals.length / 2)];
      const avgContrast = contrastSum / vals.length;

      // Only fix dust: small anomaly (differs a lot from median) in a
      // low-contrast (smooth) area. Avoids touching real detail.
      if (avgContrast < 12 && Math.abs(lum - median) > 25) {
        // Blend toward the median color (preserve some original tone).
        const blend = 0.7;
        out[i] = data[i] * (1 - blend) + median * blend;
        out[i + 1] = data[i + 1] * (1 - blend) + median * blend;
        out[i + 2] = data[i + 2] * (1 - blend) + median * blend;
      }
    }
  }
  ctx.putImageData(new ImageData(out, w, h), 0, 0);
}

// Unsharp mask sharpening: blends the original with (original - blurred) to
// enhance edge contrast.
function sharpen(ctx, w, h, amount) {
  if (amount <= 0) return;
  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d");
  bctx.filter = `blur(2px)`;
  bctx.drawImage(ctx.canvas, 0, 0);
  const orig = ctx.getImageData(0, 0, w, h);
  const blur = bctx.getImageData(0, 0, w, h);
  const od = orig.data, bd = blur.data;
  const strength = amount / 100;
  for (let i = 0; i < od.length; i += 4) {
    od[i] = clamp(od[i] + (od[i] - bd[i]) * strength, 0, 255);
    od[i + 1] = clamp(od[i + 1] + (od[i + 1] - bd[i + 1]) * strength, 0, 255);
    od[i + 2] = clamp(od[i + 2] + (od[i + 2] - bd[i + 2]) * strength, 0, 255);
  }
  ctx.putImageData(orig, 0, 0);
}

// Simple denoise: edge-preserving blur. Compares each pixel to a blurred
// version and only blends where the difference is small (flat areas),
// preserving sharp edges.
function denoise(ctx, w, h, amount) {
  if (amount <= 0) return;
  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d");
  bctx.filter = `blur(3px)`;
  bctx.drawImage(ctx.canvas, 0, 0);
  const orig = ctx.getImageData(0, 0, w, h);
  const blur = bctx.getImageData(0, 0, w, h);
  const od = orig.data, bd = blur.data;
  const blend = amount / 100;
  const threshold = 25;
  for (let i = 0; i < od.length; i += 4) {
    const diff = Math.abs(od[i] - bd[i]) + Math.abs(od[i + 1] - bd[i + 1]) + Math.abs(od[i + 2] - bd[i + 2]);
    // Only blend in flat areas (low edge response).
    const factor = diff < threshold ? blend : 0;
    od[i] = od[i] * (1 - factor) + bd[i] * factor;
    od[i + 1] = od[i + 1] * (1 - factor) + bd[i + 1] * factor;
    od[i + 2] = od[i + 2] * (1 - factor) + bd[i + 2] * factor;
  }
  ctx.putImageData(orig, 0, 0);
}

// Auto white balance using gray-world assumption: scales R and B channels so
// their averages match the overall luminance average. Corrects color casts.
function autoColorCorrect(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  let rSum = 0, gSum = 0, bSum = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }
  const rAvg = rSum / count;
  const gAvg = gSum / count;
  const bAvg = bSum / count;
  const gray = (rAvg + gAvg + bAvg) / 3;
  if (gray === 0) return;
  const rScale = gray / rAvg;
  const gScale = gray / gAvg;
  const bScale = gray / bAvg;
  // Clamp scale to avoid extreme shifts.
  const clampScale = (s) => Math.max(0.7, Math.min(1.4, s));
  const rs = clampScale(rScale);
  const gs = clampScale(gScale);
  const bs = clampScale(bScale);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * rs, 0, 255);
    data[i + 1] = clamp(data[i + 1] * gs, 0, 255);
    data[i + 2] = clamp(data[i + 2] * bs, 0, 255);
  }
  ctx.putImageData(imgData, 0, 0);
}

export function applyRetouch(canvas, settings) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  if (settings.dustRemoval) removeDust(ctx, w, h);
  if (settings.denoise > 0) denoise(ctx, w, h, settings.denoise);
  if (settings.sharpen > 0) sharpen(ctx, w, h, settings.sharpen);
  if (settings.colorCorrect) autoColorCorrect(ctx, w, h);
}