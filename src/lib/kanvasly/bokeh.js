export function applyBokeh(canvas, blurRadius, focusScale) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d");
  bctx.filter = `blur(${blurRadius}px)`;
  bctx.drawImage(canvas, 0, 0);

  const cx = w / 2;
  const cy = h / 2;
  const innerR = Math.min(w, h) * (focusScale / 100) * 0.35;
  const outerR = Math.min(w, h) * (focusScale / 100) * 0.7;

  const invMask = document.createElement("canvas");
  invMask.width = w;
  invMask.height = h;
  const imctx = invMask.getContext("2d");
  imctx.fillStyle = "#000000";
  imctx.fillRect(0, 0, w, h);
  const invGrad = imctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  invGrad.addColorStop(0, "#000000");
  invGrad.addColorStop(1, "#ffffff");
  imctx.fillStyle = invGrad;
  imctx.fillRect(0, 0, w, h);

  const blurredMasked = document.createElement("canvas");
  blurredMasked.width = w;
  blurredMasked.height = h;
  const bmctx = blurredMasked.getContext("2d");
  bmctx.drawImage(blurred, 0, 0);
  bmctx.globalCompositeOperation = "destination-in";
  bmctx.drawImage(invMask, 0, 0);

  const result = document.createElement("canvas");
  result.width = w;
  result.height = h;
  const rctx = result.getContext("2d");
  rctx.drawImage(canvas, 0, 0);
  rctx.drawImage(blurredMasked, 0, 0);

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(result, 0, 0);
}