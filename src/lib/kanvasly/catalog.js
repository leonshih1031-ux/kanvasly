import { createCanvas } from "./utils";
import { drawShadowAndReflection } from "./compositing";

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
// Shadow & reflection from the Effects step are applied so adjustments persist.
function renderAngle(productImg, backdropCanvas, transform, shadow, reflection, product) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(backdropCanvas, 0, 0);
  if (!productImg) return canvas;
  const p = product || { x: 50, y: 50, scale: 100 };
  const baseScale = Math.min((w * 0.5) / productImg.width, (h * 0.5) / productImg.height);
  const scale = baseScale * (p.scale / 100);
  const drawW = productImg.width * scale;
  const drawH = productImg.height * scale;
  const cx = (w * p.x) / 100;
  const cy = (h * p.y) / 100;
  const drawX = cx - drawW / 2;
  const drawY = cy - drawH / 2;
  const t = transform || {};
  const rotation = ((t.rotation || 0) * Math.PI) / 180;
  const scaleY = t.scaleY || 1;

  // Shadow + reflection drawn in absolute canvas space (unrotated) so they
  // stay on the ground regardless of the product's rotation/tilt — same
  // renderer used by every other studio step for visual consistency.
  drawShadowAndReflection(ctx, productImg, drawX, drawY, drawW, drawH, shadow, reflection);

  // Product drawn rotated/tilted on top of the shadow.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(1, scaleY);
  ctx.drawImage(productImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
  return canvas;
}

export function compositeAngle(productImg, backdropCanvas, transform, shadow, reflection, product) {
  return renderAngle(productImg, backdropCanvas, transform, shadow, reflection, product);
}

export function generateCatalog(productImg, backdropCanvas, shadow, reflection, product) {
  if (!productImg) return [];
  return angleList.map(({ key, label }) => {
    const canvas = renderAngle(productImg, backdropCanvas, angleTransforms[key], shadow, reflection, product);
    return { angle: key, label, dataURL: canvas.toDataURL("image/png") };
  });
}