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
// Shadow & reflection from the Effects step are applied so adjustments persist.
function renderAngle(productImg, backdropCanvas, transform, shadow, reflection) {
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
  const sh = shadow || { opacity: 0, blur: 12, offsetX: 0, offsetY: 15 };

  // Reflection (drawn unrotated, below the product centre).
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
    ctx.drawImage(refCanvas, w / 2 - drawW / 2, h / 2 + drawH / 2);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rotation);
  ctx.scale(1, scaleY);
  if (sh.opacity > 0) {
    ctx.save();
    ctx.globalAlpha = (sh.opacity / 100) * 0.85;
    ctx.filter = `blur(${sh.blur}px)`;
    ctx.drawImage(
      getShadowMask(productImg, drawW, drawH),
      -drawW / 2 + (sh.offsetX || 0),
      -drawH / 2 + (sh.offsetY || 15)
    );
    ctx.restore();
  }
  ctx.drawImage(productImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
  return canvas;
}

export function compositeAngle(productImg, backdropCanvas, transform, shadow, reflection) {
  return renderAngle(productImg, backdropCanvas, transform, shadow, reflection);
}

export function generateCatalog(productImg, backdropCanvas, shadow, reflection) {
  if (!productImg) return [];
  return angleList.map(({ key, label }) => {
    const canvas = renderAngle(productImg, backdropCanvas, angleTransforms[key], shadow, reflection);
    return { angle: key, label, dataURL: canvas.toDataURL("image/png") };
  });
}