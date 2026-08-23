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

export function compositeProduct(productImg, backdropCanvas, shadow, reflection) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const { canvas, ctx } = createCanvas(w, h);

  ctx.drawImage(backdropCanvas, 0, 0);

  const scale = Math.min((w * 0.65) / productImg.width, (h * 0.65) / productImg.height);
  const drawW = productImg.width * scale;
  const drawH = productImg.height * scale;
  const drawX = (w - drawW) / 2;
  const drawY = (h - drawH) / 2 - h * 0.03;

  if (shadow && shadow.opacity > 0) {
    const shadowCanvas = createShadowMask(productImg, drawW, drawH);
    ctx.save();
    ctx.globalAlpha = shadow.opacity / 100;
    ctx.filter = `blur(${shadow.blur}px)`;
    ctx.drawImage(shadowCanvas, drawX, drawY + shadow.offsetY);
    ctx.restore();
  }

  if (reflection && reflection.enabled) {
    ctx.save();
    ctx.globalAlpha = reflection.opacity / 100;
    const refScale = reflection.scale / 100;
    ctx.translate(0, drawY + drawH * 2);
    ctx.scale(1, -1);
    const grad = ctx.createLinearGradient(0, drawY, 0, drawY + drawH * refScale);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    const refCanvas = document.createElement("canvas");
    refCanvas.width = drawW;
    refCanvas.height = drawH * refScale;
    const refCtx = refCanvas.getContext("2d");
    refCtx.drawImage(productImg, 0, 0, drawW, drawH * refScale);
    refCtx.globalCompositeOperation = "destination-in";
    refCtx.fillStyle = grad;
    refCtx.fillRect(0, 0, drawW, drawH * refScale);
    ctx.drawImage(refCanvas, drawX, drawY);
    ctx.restore();
  }

  ctx.drawImage(productImg, drawX, drawY, drawW, drawH);
  return canvas;
}