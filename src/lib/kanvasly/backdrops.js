import { createCanvas, clamp } from "./utils";

// Deterministic seeded RNG (mulberry32) — ensures the same backdrop always
// renders identically. Fixes the flicker bug where Math.random() produced a
// new noise/shape pattern on every slider adjustment.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Subtle film grain — ±5 RGB (not ±15) for a photographic, not noisy, look.
function addNoise(ctx, w, h, amount, rng) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng() - 0.5) * amount;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(imgData, 0, 0);
}

// Cyclorama (wall-to-floor sweep) gradient — gives studio backdrops real depth.
// Top 55% = vertical wall, transition zone, bottom = horizontal floor.
function cyclorama(ctx, w, h, topColor, bottomColor) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, topColor);
  grad.addColorStop(0.5, topColor);
  grad.addColorStop(0.62, bottomColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Subtle vignette darkening at edges for depth.
  const vg = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.5, Math.max(w, h) * 0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

const generators = {
  "studio-white": (ctx, w, h) => {
    cyclorama(ctx, w, h, "#FFFFFF", "#E8E8E8");
    addNoise(ctx, w, h, 5, mulberry32(1001));
  },
  "studio-grey": (ctx, w, h) => {
    cyclorama(ctx, w, h, "#D5D5D5", "#9A9A9A");
    addNoise(ctx, w, h, 5, mulberry32(1002));
  },
  "studio-gradient": (ctx, w, h) => {
    cyclorama(ctx, w, h, "#FAFAFA", "#B8B8B8");
    addNoise(ctx, w, h, 5, mulberry32(1003));
  },
  "lifestyle-warm": (ctx, w, h) => {
    const rng = mulberry32(1004);
    cyclorama(ctx, w, h, "#F5E6CA", "#C4A878");
    // Warm radial glow (simulates a warm light source).
    const g = ctx.createRadialGradient(w * 0.35, h * 0.3, 0, w * 0.35, h * 0.3, Math.max(w, h) * 0.6);
    g.addColorStop(0, "rgba(255, 220, 160, 0.25)");
    g.addColorStop(1, "rgba(255, 220, 160, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    addNoise(ctx, w, h, 5, rng);
  },
  "lifestyle-wood": (ctx, w, h) => {
    const rng = mulberry32(1005);
    const plankCount = 6;
    const plankW = w / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const x = i * plankW;
      const baseShade = 0.82 + rng() * 0.22;
      const r = Math.round(139 * baseShade);
      const g = Math.round(100 * baseShade);
      const b = Math.round(60 * baseShade);
      // Vertical gradient per plank (slight perspective darkening).
      const pg = ctx.createLinearGradient(x, 0, x, h);
      pg.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
      pg.addColorStop(1, `rgb(${Math.round(r * 0.82)}, ${Math.round(g * 0.82)}, ${Math.round(b * 0.82)})`);
      ctx.fillStyle = pg;
      ctx.fillRect(x, 0, plankW, h);
      // Wood grain lines.
      ctx.strokeStyle = `rgba(60, 40, 20, ${0.08 + rng() * 0.06})`;
      ctx.lineWidth = 1;
      for (let j = 0; j < 18; j++) {
        ctx.beginPath();
        const yLine = rng() * h;
        ctx.moveTo(x, yLine);
        ctx.bezierCurveTo(
          x + plankW * 0.3, yLine + (rng() - 0.5) * 8,
          x + plankW * 0.7, yLine + (rng() - 0.5) * 8,
          x + plankW, yLine + (rng() - 0.5) * 4
        );
        ctx.stroke();
      }
      // Occasional knot.
      if (rng() > 0.6) {
        const kx = x + rng() * plankW;
        const ky = rng() * h;
        const kr = 4 + rng() * 8;
        const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
        kg.addColorStop(0, "rgba(40, 25, 10, 0.5)");
        kg.addColorStop(1, "rgba(40, 25, 10, 0)");
        ctx.fillStyle = kg;
        ctx.beginPath();
        ctx.arc(kx, ky, kr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Plank separators.
    ctx.fillStyle = "rgba(30, 18, 8, 0.55)";
    for (let i = 1; i < plankCount; i++) ctx.fillRect(i * plankW - 1, 0, 2, h);
    // Subtle perspective darkening at bottom.
    const pg = ctx.createLinearGradient(0, h * 0.6, 0, h);
    pg.addColorStop(0, "rgba(0,0,0,0)");
    pg.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = pg;
    ctx.fillRect(0, 0, w, h);
    addNoise(ctx, w, h, 4, rng);
  },
  "outdoor-sky": (ctx, w, h) => {
    const rng = mulberry32(1006);
    // Sky gradient (deep blue → light blue → horizon haze).
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#3B7DC4");
    grad.addColorStop(0.45, "#6FB5E8");
    grad.addColorStop(0.7, "#A8D8F0");
    grad.addColorStop(0.72, "#C4B896"); // horizon line
    grad.addColorStop(1, "#8A7E62");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Soft realistic clouds — layered blurred ellipses, not circles.
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const cx = rng() * w;
      const cy = rng() * h * 0.45;
      const r = 30 + rng() * 50;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + rng() * 0.25})`;
      ctx.filter = `blur(${8 + rng() * 12}px)`;
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.ellipse(cx + (rng() - 0.5) * r * 1.5, cy + (rng() - 0.5) * r * 0.4, r * (0.6 + rng() * 0.5), r * (0.35 + rng() * 0.3), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    addNoise(ctx, w, h, 3, rng);
  },
  "outdoor-nature": (ctx, w, h) => {
    const rng = mulberry32(1007);
    // Grass gradient with perspective (lighter near horizon, darker in foreground).
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#8BC480");
    grad.addColorStop(0.5, "#6BA858");
    grad.addColorStop(1, "#3D7A30");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Fine grass texture.
    addNoise(ctx, w, h, 12, rng);
    // Grass blade strokes (denser in foreground for perspective).
    ctx.strokeStyle = "rgba(40, 80, 30, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 400; i++) {
      const y = rng() * h;
      const density = y / h; // more blades lower (foreground)
      if (rng() > density * 0.8 + 0.2) continue;
      const x = rng() * w;
      const len = 3 + rng() * 8 * density;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rng() - 0.5) * 3, y - len);
      ctx.stroke();
    }
  },
  "abstract-purple": (ctx, w, h) => {
    const rng = mulberry32(1008);
    ctx.fillStyle = "#1A1033";
    ctx.fillRect(0, 0, w, h);
    const g1 = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.3, h * 0.3, Math.max(w, h) * 0.7);
    g1.addColorStop(0, "rgba(83, 74, 183, 0.55)");
    g1.addColorStop(0.5, "rgba(60, 52, 137, 0.25)");
    g1.addColorStop(1, "rgba(26, 16, 51, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createRadialGradient(w * 0.7, h * 0.7, 0, w * 0.7, h * 0.7, Math.max(w, h) * 0.5);
    g2.addColorStop(0, "rgba(15, 110, 86, 0.28)");
    g2.addColorStop(1, "rgba(15, 110, 86, 0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
    addNoise(ctx, w, h, 4, rng);
  },
  "abstract-geometric": (ctx, w, h) => {
    const rng = mulberry32(1009);
    ctx.fillStyle = "#0E0B1A";
    ctx.fillRect(0, 0, w, h);
    const colors = ["#534AB7", "#0F6E56", "#6B62D6", "#14A082"];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.12 + rng() * 0.13;
      ctx.beginPath();
      const cx = rng() * w;
      const cy = rng() * h;
      const r = 40 + rng() * 120;
      const shape = Math.floor(rng() * 3);
      if (shape === 0) {
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      } else if (shape === 1) {
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 0.866, cy + r * 0.5);
        ctx.lineTo(cx - r * 0.866, cy + r * 0.5);
        ctx.closePath();
      } else {
        ctx.rect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

export const backdropList = [
  { key: "studio-white", label: "Studio white" },
  { key: "studio-grey", label: "Studio grey" },
  { key: "studio-gradient", label: "Gradient" },
  { key: "lifestyle-warm", label: "Lifestyle warm" },
  { key: "lifestyle-wood", label: "Wood texture" },
  { key: "outdoor-sky", label: "Sky / outdoor" },
  { key: "outdoor-nature", label: "Nature" },
  { key: "abstract-purple", label: "Abstract purple" },
  { key: "abstract-geometric", label: "Geometric" },
];

export function generateBackdrop(key, w, h) {
  const { canvas, ctx } = createCanvas(w, h);
  const gen = generators[key] || generators["studio-white"];
  gen(ctx, w, h);
  return canvas;
}

// Solid color backdrop with a subtle radial vignette for depth.
export function generateColorBackdrop(color, w, h) {
  const { canvas, ctx } = createCanvas(w, h);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(255,255,255,0.06)");
  g.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return canvas;
}

export function loadPhotoBackdrop(url, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const { canvas, ctx } = createCanvas(w, h);
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error("Could not load photo"));
    img.src = url;
  });
}