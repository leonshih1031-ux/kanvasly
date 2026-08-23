import { createCanvas } from "./utils";
import { createShadowMask } from "./compositing";

export const angleList = [
  { key: "front", label: "Front" },
  { key: "left", label: "Left 30" },
  { key: "right", label: "Right 30" },
  { key: "top", label: "Top-down" },
  { key: "three-quarter", label: "3/4 view", span: true },
];

const transforms = {
  front: null,
  left: { skewX: -0.17, scaleX: 0.82 },
  right: { skewX: 0.17, scaleX: 0.82 },
  top: { scaleY: 0.68, skewY: 0.087 },
  "three-quarter": { skewX: -0.087, scaleX: 0.88, scaleY: 0.93 },
};

export function generateCatalog(productImg, backdropCanvas) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const scale = Math.min((w * 0.5) / productImg.width, (h * 0.5) / productImg.height);
  const drawW = productImg.width * scale;
  const drawH = productImg.height * scale;

  return angleList.map(({ key, label }) => {
    const { canvas, ctx } = createCanvas(w, h);
    ctx.drawImage(backdropCanvas, 0, 0);
    const transform = transforms[key];

    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (transform) {
      ctx.transform(
        transform.scaleX || 1, 0,
        transform.skewX || 0,
        transform.scaleY || 1,
        0, 0
      );
    }
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.filter = "blur(12px)";
    const shadowCanvas = createShadowMask(productImg, drawW, drawH);
    ctx.drawImage(shadowCanvas, -drawW / 2, -drawH / 2 + 12);
    ctx.restore();

    ctx.drawImage(productImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    return { angle: key, label, dataURL: canvas.toDataURL("image/png") };
  });
}