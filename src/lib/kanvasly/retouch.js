export function applyRetouch(canvas, settings) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  if (settings.smoothing > 0) smoothSkin(ctx, w, h, settings.smoothing);
  if (settings.teethWhitening) whitenTeeth(ctx, w, h);
  if (settings.blemishRemoval) removeBlemishes(ctx, w, h);
}

function smoothSkin(ctx, w, h, smoothing) {
  const original = ctx.getImageData(0, 0, w, h);
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = w;
  blurCanvas.height = h;
  const bctx = blurCanvas.getContext("2d");
  bctx.filter = "blur(3px)";
  bctx.drawImage(ctx.canvas, 0, 0);
  const blurred = bctx.getImageData(0, 0, w, h);
  const origData = original.data;
  const blurData = blurred.data;
  const blend = smoothing / 100;
  const threshold = 25;

  for (let i = 0; i < origData.length; i += 4) {
    const rDiff = Math.abs(origData[i] - blurData[i]);
    const gDiff = Math.abs(origData[i + 1] - blurData[i + 1]);
    const bDiff = Math.abs(origData[i + 2] - blurData[i + 2]);
    const edgeStrength = (rDiff + gDiff + bDiff) / 3;
    const edgeFactor = Math.min(1, edgeStrength / threshold);
    const mixAmount = blend * (1 - edgeFactor);
    origData[i] = origData[i] * (1 - mixAmount) + blurData[i] * mixAmount;
    origData[i + 1] = origData[i + 1] * (1 - mixAmount) + blurData[i + 1] * mixAmount;
    origData[i + 2] = origData[i + 2] * (1 - mixAmount) + blurData[i + 2] * mixAmount;
  }
  ctx.putImageData(original, 0, 0);
}

function whitenTeeth(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const yStart = Math.floor(h * 0.55);
  const yEnd = Math.floor(h * 0.75);
  const xStart = Math.floor(w * 0.25);
  const xEnd = Math.floor(w * 0.75);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max > 0 ? (max - min) / max : 0;
      if (max > 150 && saturation < 0.15) {
        data[i] = Math.min(255, r + 30);
        data[i + 1] = Math.min(255, g + 30);
        data[i + 2] = Math.min(255, b + 20);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function removeBlemishes(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const result = new Uint8ClampedArray(data);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const isSkin = r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15 && max - min < 60;
      if (!isSkin) continue;

      const neighbors = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          neighbors.push(data[((y + dy) * w + (x + dx)) * 4]);
        }
      }
      neighbors.sort((a, b) => a - b);
      const median = neighbors[4];
      if (Math.abs(r - median) > 20) {
        result[i] = median;
        result[i + 1] = data[i + 1] + (median - r);
        result[i + 2] = data[i + 2] + (median - r);
      }
    }
  }
  ctx.putImageData(new ImageData(result, w, h), 0, 0);
}