import { createCanvas } from "./utils";
import { createShadowMask } from "./compositing";

// Cache the (opaque) shadow mask per product image + size so the live
// rotation drag never re-runs the pixel loop on every frame.
const shadowCache = new WeakMap();
function getShadowMask(productImg, drawW, drawH) {
  const key = `${Math.round(drawW)}x${Math.round(drawH)}`;
  const entry = shadowCache.get(productImg);
  if (entry && entry.key === key) return entry.canvas;
  const canvas = createShadowMask(productImg, drawW, drawH);
  shadowCache.set(productImg, { key, canvas });
  return canvas;
}

export const angleList = [
  { key: "front", label: "Front" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "top", label: "Top-down" },
  { key: "three-quarter", label: "3/4 view", span: true },
];

// Presets now drive a real rotation + vertical tilt (scaleY).
export const angleTransforms = {
  front: null,
  left: { rotation: -18, scaleY: 0.96 },
  right: { rotation: 18, scaleY: 0.96 },
  top: { rotation: 0, scaleY: 0.66 },
  "three-quarter": { rotation: -10, scaleY: 0.9 },
};

// Renders the product onto a backdrop with a rotation + tilt transform
// (used for the live, cursor-controlled angle in the catalog step).
function renderAngle(productImg, backdropCanvas, transform) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(backdropCanvas, 0, 0);
  if (!productImg) return canvas;
  const scale = Math.min((w * 0.5) / productImg.width, (h * 0.5) / productImg.height);
  const drawW = productImg.width * scale;
  const drawH = productImg.height * scale;
  const t = transform || {};
  const rotation = ((t.rotation || 0) * Math.PI) / 180;
  const scaleY = t.scaleY || 1;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rotation);
  ctx.scale(1, scaleY);
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.filter = "blur(12px)";
  ctx.drawImage(getShadowMask(productImg, drawW, drawH), -drawW / 2, -drawH / 2 + 12);
  ctx.restore();
  ctx.drawImage(productImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
  return canvas;
}

export function compositeAngle(productImg, backdropCanvas, transform) {
  return renderAngle(productImg, backdropCanvas, transform);
}

export function generateCatalog(productImg, backdropCanvas) {
  if (!productImg) return [];
  return angleList.map(({ key, label }) => {
    const canvas = renderAngle(productImg, backdropCanvas, angleTransforms[key]);
    return { angle: key, label, dataURL: canvas.toDataURL("image/png") };
  });
}