import { createCanvas } from "./utils";
import { drawShadowAndReflection } from "./compositing";

// Draws a tapered filled limb between two points.
function limb(ctx, x1, y1, x2, y2, w1, w2) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  ctx.beginPath();
  ctx.moveTo(x1 + (nx * w1) / 2, y1 + (ny * w1) / 2);
  ctx.lineTo(x2 + (nx * w2) / 2, y2 + (ny * w2) / 2);
  ctx.lineTo(x2 - (nx * w2) / 2, y2 - (ny * w2) / 2);
  ctx.lineTo(x1 - (nx * w1) / 2, y1 - (ny * w1) / 2);
  ctx.closePath();
  ctx.fill();
}

// Solid, well-proportioned model silhouette (replaces the old stick-figure outline).
function drawModel(ctx, w, h, pose) {
  // contact shadow
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.filter = "blur(10px)";
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.965, w * 0.16, h * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const grad = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.95);
  grad.addColorStop(0, "#6A6191");
  grad.addColorStop(1, "#2C2742");
  ctx.fillStyle = grad;

  // head
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.12, w * 0.055, h * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();
  // neck
  ctx.fillRect(w * 0.475, h * 0.175, w * 0.05, h * 0.045);

  // torso (shoulders -> waist -> hips)
  ctx.beginPath();
  ctx.moveTo(w * 0.4, h * 0.22);
  ctx.bezierCurveTo(w * 0.44, h * 0.205, w * 0.56, h * 0.205, w * 0.6, h * 0.22);
  ctx.lineTo(w * 0.555, h * 0.5);
  ctx.lineTo(w * 0.6, h * 0.63);
  ctx.lineTo(w * 0.4, h * 0.63);
  ctx.lineTo(w * 0.445, h * 0.5);
  ctx.closePath();
  ctx.fill();

  // legs
  limb(ctx, w * 0.44, h * 0.63, w * 0.42, h * 0.95, w * 0.1, w * 0.07);
  limb(ctx, w * 0.56, h * 0.63, w * 0.58, h * 0.95, w * 0.1, w * 0.07);

  // arms by pose
  const ls = { x: w * 0.405, y: h * 0.235 };
  const rs = { x: w * 0.595, y: h * 0.235 };
  if (pose === "holding") {
    const le = { x: w * 0.39, y: h * 0.42 };
    const lh = { x: w * 0.5, y: h * 0.46 };
    const re = { x: w * 0.61, y: h * 0.42 };
    const rh = { x: w * 0.5, y: h * 0.46 };
    limb(ctx, ls.x, ls.y, le.x, le.y, w * 0.055, w * 0.045);
    limb(ctx, le.x, le.y, lh.x, lh.y, w * 0.045, w * 0.035);
    limb(ctx, rs.x, rs.y, re.x, re.y, w * 0.055, w * 0.045);
    limb(ctx, re.x, re.y, rh.x, rh.y, w * 0.045, w * 0.035);
  } else if (pose === "wearing") {
    limb(ctx, ls.x, ls.y, w * 0.33, h * 0.55, w * 0.055, w * 0.04);
    limb(ctx, rs.x, rs.y, w * 0.67, h * 0.55, w * 0.055, w * 0.04);
  } else {
    limb(ctx, ls.x, ls.y, w * 0.37, h * 0.6, w * 0.055, w * 0.035);
    limb(ctx, rs.x, rs.y, w * 0.63, h * 0.6, w * 0.055, w * 0.035);
  }

  // soft rim light along the right edge
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(w * 0.585, h * 0.22, w * 0.018, h * 0.4);
  ctx.restore();
}

export const modelPoseList = [
  { key: "standing", label: "Standing" },
  { key: "holding", label: "Holding" },
  { key: "wearing", label: "Wearing" },
];

// Composites the product onto an AI-generated model image (cover-fit) instead of a procedural silhouette.
// Shadow & reflection from the Effects step are applied so adjustments persist.
export function compositeOnAIModel(productImg, modelCanvas, scale, xPct, yPct, backdropCanvas, shadow, reflection) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(backdropCanvas, 0, 0);
  const s = Math.max(w / modelCanvas.width, h / modelCanvas.height);
  const dw = modelCanvas.width * s;
  const dh = modelCanvas.height * s;
  ctx.drawImage(modelCanvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
  if (!productImg) return canvas;
  const pScale = Math.min((w * 0.3) / productImg.width, (h * 0.3) / productImg.height) * (scale / 100);
  const drawW = productImg.width * pScale;
  const drawH = productImg.height * pScale;
  const drawX = (w * xPct) / 100 - drawW / 2;
  const drawY = (h * yPct) / 100 - drawH / 2;
  drawShadowAndReflection(ctx, productImg, drawX, drawY, drawW, drawH, shadow, reflection);
  ctx.drawImage(productImg, drawX, drawY, drawW, drawH);
  return canvas;
}

export function compositeOnModel(productImg, pose, scale, xPct, yPct, backdropCanvas, shadow, reflection) {
  const w = backdropCanvas.width;
  const h = backdropCanvas.height;
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(backdropCanvas, 0, 0);
  drawModel(ctx, w, h, pose);
  if (!productImg) return canvas;
  const pScale = Math.min((w * 0.3) / productImg.width, (h * 0.3) / productImg.height) * (scale / 100);
  const drawW = productImg.width * pScale;
  const drawH = productImg.height * pScale;
  const drawX = (w * xPct) / 100 - drawW / 2;
  const drawY = (h * yPct) / 100 - drawH / 2;
  drawShadowAndReflection(ctx, productImg, drawX, drawY, drawW, drawH, shadow, reflection);
  ctx.drawImage(productImg, drawX, drawY, drawW, drawH);
  return canvas;
}