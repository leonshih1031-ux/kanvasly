// Depth-of-field / bokeh effect with a MOVABLE focus point.
// The user can drag the focus crosshair on the canvas; the in-focus area
// is a radial gradient centered on that point, not always the canvas center.

export function applyBokeh(canvas, blurRadius, focusScale, focusX = 50, focusY = 50) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  // Blurred copy of the entire canvas.
  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d");
  bctx.filter = `blur(${blurRadius}px)`;
  bctx.drawImage(canvas, 0, 0);

  // Focus point in pixels.
  const cx = (focusX / 100) * w;
  const cy = (focusY / 100) * h;
  const innerR = Math.min(w, h) * (focusScale / 100) * 0.35;
  const outerR = Math.min(w, h) * (focusScale / 100) * 0.7;

  // Inverted mask: black (keep blurred) outside focus, white (keep sharp) inside.
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

  // Blurred area = blurred image masked to only show outside the focus circle.
  const blurredMasked = document.createElement("canvas");
  blurredMasked.width = w;
  blurredMasked.height = h;
  const bmctx = blurredMasked.getContext("2d");
  bmctx.drawImage(blurred, 0, 0);
  bmctx.globalCompositeOperation = "destination-in";
  bmctx.drawImage(invMask, 0, 0);

  // Composite: sharp original + blurred outside-focus.
  const result = document.createElement("canvas");
  result.width = w;
  result.height = h;
  const rctx = result.getContext("2d");
  rctx.drawImage(canvas, 0, 0);
  rctx.drawImage(blurredMasked, 0, 0);

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(result, 0, 0);
}