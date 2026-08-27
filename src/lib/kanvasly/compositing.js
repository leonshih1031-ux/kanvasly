import { createCanvas } from "./utils";

export function createShadowMask(productImg, w, h) {
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(productImg, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Shared shadow + reflection renderer used by every studio composition step.
// Shadow uses gradient blur: sharper near the contact point (bottom),
// blurrier farther away — for a grounded, realistic look.
export function drawShadowAndReflection(ctx, productImg, drawX, drawY, drawW, drawH, shadow, reflection) {
  if (shadow && shadow.enabled !== false && shadow.opacity > 0) {
    const shadowCanvas = createShadowMask(productImg, drawW, drawH);

    // Cast shadow with perspective skew + gradient blur.
    // Two layers: sharp (near contact) + blurry (far), masked by vertical gradient.
    const { canvas: sharpLayer, ctx: slCtx } = createCanvas(drawW, drawH);
    slCtx.globalAlpha = (shadow.opacity / 100) * 0.85;
    slCtx.filter = `blur(${Math.max(2, shadow.blur * 0.2)}px)`;
    slCtx.drawImage(shadowCanvas, 0, 0);

    const { canvas: blurryLayer, ctx: blCtx } = createCanvas(drawW, drawH);
    blCtx.globalAlpha = (shadow.opacity / 100) * 0.7;
    blCtx.filter = `blur(${shadow.blur}px)`;
    blCtx.drawImage(shadowCanvas, 0, 0);

    // Vertical gradient mask: sharp at bottom (contact), blurry at top (far).
    const { canvas: mask, ctx: mCtx } = createCanvas(drawW, drawH);
    const mg = mCtx.createLinearGradient(0, 0, 0, drawH);
    mg.addColorStop(0, "rgba(255,255,255,0)");
    mg.addColorStop(0.7, "rgba(255,255,255,0.5)");
    mg.addColorStop(1, "rgba(255,255,255,1)");
    mCtx.fillStyle = mg;
    mCtx.fillRect(0, 0, drawW, drawH);

    // Apply mask to sharp layer (destination-in keeps where mask is white).
    slCtx.globalCompositeOperation = "destination-in";
    slCtx.globalAlpha = 1;
    slCtx.filter = "none";
    slCtx.drawImage(mask, 0, 0);
    // Inverse mask for blurry layer.
    const { canvas: invMask, ctx: imCtx } = createCanvas(drawW, drawH);
    const ig = imCtx.createLinearGradient(0, 0, 0, drawH);
    ig.addColorStop(0, "rgba(255,255,255,1)");
    ig.addColorStop(0.3, "rgba(255,255,255,0.5)");
    ig.addColorStop(1, "rgba(255,255,255,0)");
    imCtx.fillStyle = ig;
    imCtx.fillRect(0, 0, drawW, drawH);
    blCtx.globalCompositeOperation = "destination-in";
    blCtx.globalAlpha = 1;
    blCtx.filter = "none";
    blCtx.drawImage(invMask, 0, 0);

    // Draw both shadow layers with perspective skew + offset.
    ctx.save();
    ctx.transform(1, 0, -0.22, 1, 0, 0);
    ctx.drawImage(blurryLayer, drawX + (shadow.offsetX || 0), drawY + (shadow.offsetY || 0));
    ctx.drawImage(sharpLayer, drawX + (shadow.offsetX || 0), drawY + (shadow.offsetY || 0));
    ctx.restore();

    // Contact shadow: tight, soft, hugging the product base.
    ctx.save();
    ctx.globalAlpha = (shadow.opacity / 100) * 0.5;
    ctx.filter = `blur(${Math.max(2, shadow.blur * 0.28)}px)`;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(
      drawX + drawW / 2,
      drawY + drawH + (shadow.offsetY || 0) * 0.4,
      drawW * 0.42,
      Math.max(4, drawH * 0.05),
      0, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  // Reflection: mirrored, multi-stop fade, optional blur.
  if (reflection && reflection.enabled) {
    const refScale = reflection.scale / 100;
    const refH = drawH * refScale;
    const refCanvas = document.createElement("canvas");
    refCanvas.width = drawW;
    refCanvas.height = refH;
    const refCtx = refCanvas.getContext("2d");
    refCtx.save();
    refCtx.translate(0, refH);
    refCtx.scale(1, -1);
    refCtx.drawImage(productImg, 0, 0, drawW, drawH);
    refCtx.restore();
    const grad = refCtx.createLinearGradient(0, 0, 0, refH);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    refCtx.globalCompositeOperation = "destination-in";
    refCtx.fillStyle = grad;
    refCtx.fillRect(0, 0, drawW, refH);
    ctx.save();
    ctx.globalAlpha = reflection.opacity / 100;
    ctx.filter = `blur(${reflection.blur || 0}px)`;
    ctx.drawImage(refCanvas, drawX, drawY + drawH);
    ctx.restore();
  }
}

export function compositeProduct(productImg, backdropCanvas, shadow, reflection, product, backdropBlur = 0) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const { canvas, ctx } = createCanvas(w, h);
  // Draw backdrop with optional blur (depth of field) — product stays sharp.
  if (backdropBlur > 0) {
    ctx.filter = `blur(${backdropBlur}px)`;
  }
  ctx.drawImage(backdropCanvas, 0, 0);
  ctx.filter = "none";
  if (!productImg) return canvas;

  const p = product || { x: 50, y: 50, scale: 100 };
  const baseScale = Math.min((w * 0.65) / productImg.width, (h * 0.65) / productImg.height);
  const scale = baseScale * (p.scale / 100);
  const drawW = productImg.width * scale;
  const drawH = productImg.height * scale;
  const drawX = (w * p.x) / 100 - drawW / 2;
  const drawY = (h * p.y) / 100 - drawH / 2;

  drawShadowAndReflection(ctx, productImg, drawX, drawY, drawW, drawH, shadow, reflection);
  ctx.drawImage(productImg, drawX, drawY, drawW, drawH);
  return canvas;
}