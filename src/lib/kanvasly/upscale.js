import { createCanvas } from "./utils";

// High-quality client-side upscaling. Steps up in doublings (each step doubles the
// resolution) which preserves edges far better than a single huge jump, then applies
// an unsharp mask for crispness. Runs entirely in-browser — no API, instant.
export function upscaleCanvas(source, scale, sharpen) {
  const sw = source.width || source.naturalWidth;
  const sh = source.height || source.naturalHeight;
  const tw = Math.max(1, Math.round(sw * scale));
  const th = Math.max(1, Math.round(sh * scale));

  let current = source;
  let cw = sw;
  let ch = sh;

  // Double until we're within 2x of the target, then a final precise draw.
  while (cw * 2 <= tw) {
    const { canvas, ctx } = createCanvas(cw * 2, ch * 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, cw * 2, ch * 2);
    current = canvas;
    cw *= 2;
    ch *= 2;
  }
  if (cw !== tw || ch !== th) {
    const { canvas, ctx } = createCanvas(tw, th);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, tw, th);
    current = canvas;
  }

  if (sharpen > 0) applyUnsharpMask(current, sharpen);
  return current;
}

// Classic unsharp mask: out = original + amount * (original - blurred).
function applyUnsharpMask(canvas, amount) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d");
  bctx.filter = `blur(${Math.max(0.6, (amount / 100) * 1.6)}px)`;
  bctx.drawImage(canvas, 0, 0);
  bctx.filter = "none";

  const orig = ctx.getImageData(0, 0, w, h);
  const blur = bctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const a = amount / 100;
  for (let i = 0; i < orig.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const o = orig.data[i + c];
      const b = blur.data[i + c];
      out.data[i + c] = Math.max(0, Math.min(255, o + a * (o - b)));
    }
    out.data[i + 3] = orig.data[i + 3];
  }
  ctx.putImageData(out, 0, 0);
}