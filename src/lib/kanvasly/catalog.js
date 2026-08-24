import { createCanvas } from "./utils";
import { createShadowMask } from "./compositing";

export const angleList = [
  { key: "front", label: "Front" },
  { key: "left", label: "Left 30" },
  { key: "right", label: "Right 30" },
  { key: "top", label: "Top-down" },
  { key: "three-quarter", label: "3/4 view", span: true },
];

export const angleTransforms = {
  front: null,
  left: { skewX: -0.17, scaleX: 0.82 },
  right: { skewX: 0.17, scaleX: 0.82 },
  top: { scaleY: 0.68, skewY: 0.087 },
  "three-quarter": { skewX: -0.087, scaleX: 0.88, scaleY: 0.93 },
};

// Renders the product onto a backdrop with a single transform (used for the
// live, cursor-controlled angle in the catalog step).
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
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.transform(t.scaleX || 1, 0, t.skewX || 0, t.scaleY || 1, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.filter = "blur(12px)";
  const shadowCanvas = createShadowMask(productImg, drawW, drawH);
  ctx.drawImage(shadowCanvas, -drawW / 2, -drawH / 2 + 12);
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