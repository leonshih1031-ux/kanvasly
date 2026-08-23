import { createCanvas } from "./utils";

const poses = {
  standing: (ctx, w, h) => {
    ctx.fillStyle = "rgba(40, 35, 60, 0.15)";
    ctx.strokeStyle = "rgba(163, 152, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.12, w * 0.06, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.44, h * 0.18);
    ctx.lineTo(w * 0.4, h * 0.5);
    ctx.lineTo(w * 0.38, h * 0.85);
    ctx.lineTo(w * 0.42, h * 0.95);
    ctx.lineTo(w * 0.48, h * 0.95);
    ctx.lineTo(w * 0.5, h * 0.55);
    ctx.lineTo(w * 0.52, h * 0.95);
    ctx.lineTo(w * 0.58, h * 0.95);
    ctx.lineTo(w * 0.62, h * 0.85);
    ctx.lineTo(w * 0.6, h * 0.5);
    ctx.lineTo(w * 0.56, h * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.44, h * 0.2);
    ctx.lineTo(w * 0.3, h * 0.45);
    ctx.lineTo(w * 0.28, h * 0.55);
    ctx.moveTo(w * 0.56, h * 0.2);
    ctx.lineTo(w * 0.7, h * 0.45);
    ctx.lineTo(w * 0.72, h * 0.55);
    ctx.stroke();
  },
  holding: (ctx, w, h) => {
    ctx.fillStyle = "rgba(40, 35, 60, 0.15)";
    ctx.strokeStyle = "rgba(163, 152, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.12, w * 0.06, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.44, h * 0.18);
    ctx.lineTo(w * 0.4, h * 0.5);
    ctx.lineTo(w * 0.38, h * 0.85);
    ctx.lineTo(w * 0.42, h * 0.95);
    ctx.lineTo(w * 0.58, h * 0.95);
    ctx.lineTo(w * 0.62, h * 0.85);
    ctx.lineTo(w * 0.6, h * 0.5);
    ctx.lineTo(w * 0.56, h * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.44, h * 0.22);
    ctx.lineTo(w * 0.42, h * 0.35);
    ctx.lineTo(w * 0.46, h * 0.45);
    ctx.moveTo(w * 0.56, h * 0.22);
    ctx.lineTo(w * 0.58, h * 0.35);
    ctx.lineTo(w * 0.54, h * 0.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.46, w * 0.05, h * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  wearing: (ctx, w, h) => {
    ctx.fillStyle = "rgba(40, 35, 60, 0.15)";
    ctx.strokeStyle = "rgba(163, 152, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.1, w * 0.06, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.4, h * 0.17);
    ctx.lineTo(w * 0.35, h * 0.45);
    ctx.lineTo(w * 0.34, h * 0.7);
    ctx.lineTo(w * 0.4, h * 0.9);
    ctx.lineTo(w * 0.6, h * 0.9);
    ctx.lineTo(w * 0.66, h * 0.7);
    ctx.lineTo(w * 0.65, h * 0.45);
    ctx.lineTo(w * 0.6, h * 0.17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.4, h * 0.2);
    ctx.lineTo(w * 0.28, h * 0.5);
    ctx.lineTo(w * 0.26, h * 0.65);
    ctx.moveTo(w * 0.6, h * 0.2);
    ctx.lineTo(w * 0.72, h * 0.5);
    ctx.lineTo(w * 0.74, h * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.9);
    ctx.lineTo(w * 0.4, h * 0.98);
    ctx.moveTo(w * 0.58, h * 0.9);
    ctx.lineTo(w * 0.6, h * 0.98);
    ctx.stroke();
  },
};

export const modelPoseList = [
  { key: "standing", label: "Standing" },
  { key: "holding", label: "Holding" },
  { key: "wearing", label: "Wearing" },
];

export function compositeOnModel(productImg, pose, scale, xPct, yPct, backdropCanvas) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(backdropCanvas, 0, 0);
  (poses[pose] || poses.standing)(ctx, w, h);
  const pScale = Math.min((w * 0.3) / productImg.width, (h * 0.3) / productImg.height) * (scale / 100);
  const drawW = productImg.width * pScale;
  const drawH = productImg.height * pScale;
  const drawX = (w * xPct) / 100 - drawW / 2;
  const drawY = (h * yPct) / 100 - drawH / 2;
  ctx.drawImage(productImg, drawX, drawY, drawW, drawH);
  return canvas;
}