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

// Shared shadow + reflection renderer used by every studio composition step
// so that adjustments made in the Effects step persist across catalog, on-model,
// and export.  All coordinates are absolute canvas-space.
export function drawShadowAndReflection(ctx, productImg, drawX, drawY, drawW, drawH, shadow, reflection) {
  // Cast shadow: blurred silhouette with a ground-perspective skew + offset.
  if (shadow && shadow.enabled !== false && shadow.opacity > 0) {
    const shadowCanvas = createShadowMask(productImg, drawW, drawH);
    ctx.save();
    ctx.globalAlpha = (shadow.opacity / 100) * 0.85;
    ctx.filter = `blur(${shadow.blur}px)`;
    ctx.transform(1, 0, -0.22, 1, 0, 0);
    ctx.drawImage(shadowCanvas, drawX + (shadow.offsetX || 0), drawY + (shadow.offsetY || 0));
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
      0,
      0,
      Math.PI * 2
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

export function compositeProduct(productImg, backdropCanvas, shadow, reflection, product) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(backdropCanvas, 0, 0);
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