import { clamp } from "./utils";

export const lightingPresets = {
  warm: { brightness: 105, contrast: 105, saturation: 115, temperature: 15, tint: 0, vignette: 10, vignetteShape: 50 },
  cool: { brightness: 100, contrast: 110, saturation: 90, temperature: -15, tint: 0, vignette: 5, vignetteShape: 50 },
  golden: { brightness: 110, contrast: 95, saturation: 130, temperature: 30, tint: 5, vignette: 20, vignetteShape: 50 },
  overcast: { brightness: 95, contrast: 85, saturation: 80, temperature: -5, tint: 0, vignette: 0, vignetteShape: 50 },
  dramatic: { brightness: 90, contrast: 130, saturation: 110, temperature: 0, tint: 0, vignette: 35, vignetteShape: 40 },
  neutral: { brightness: 100, contrast: 100, saturation: 100, temperature: 0, tint: 0, vignette: 0, vignetteShape: 50 },
};

export const lightingPresetList = [
  { key: "warm", label: "Warm" },
  { key: "cool", label: "Cool" },
  { key: "golden", label: "Golden hour" },
  { key: "overcast", label: "Overcast" },
  { key: "dramatic", label: "Dramatic" },
  { key: "neutral", label: "Neutral" },
];

// Deterministic noise — stable across re-renders so grain doesn't shimmer
// while dragging sliders.
function hashNoise(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Clarity: local contrast. Boosts midtone detail by amplifying the difference
// between each pixel and a blurred version of itself.
function applyClarity(ctx, w, h, amount) {
  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d");
  bctx.filter = `blur(4px)`;
  bctx.drawImage(ctx.canvas, 0, 0);
  const orig = ctx.getImageData(0, 0, w, h);
  const blur = bctx.getImageData(0, 0, w, h);
  const od = orig.data;
  const bd = blur.data;
  const strength = (amount / 100) * 0.6;
  for (let i = 0; i < od.length; i += 4) {
    od[i] = clamp(od[i] + (od[i] - bd[i]) * strength, 0, 255);
    od[i + 1] = clamp(od[i + 1] + (od[i + 1] - bd[i + 1]) * strength, 0, 255);
    od[i + 2] = clamp(od[i + 2] + (od[i + 2] - bd[i + 2]) * strength, 0, 255);
  }
  ctx.putImageData(orig, 0, 0);
}

export function applyRelighting(canvas, settings) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const {
    brightness = 100, contrast = 100, saturation = 100,
    exposure = 0, highlights = 0, shadows = 0, whites = 0, blacks = 0,
    vibrance = 0, clarity = 0, fade = 0, grain = 0,
    temperature = 0, tint = 0, vignette = 0, vignetteShape = 50,
  } = settings;

  // 1. CSS filter pass: brightness, contrast, saturation, exposure.
  const exposureFactor = Math.pow(2, exposure / 100);
  const brightVal = (brightness / 100) * exposureFactor * 100;
  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext("2d");
  tctx.filter = `brightness(${brightVal}%) contrast(${contrast}%) saturate(${saturation}%)`;
  tctx.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(temp, 0, 0);

  // 2. Clarity (local contrast).
  if (clarity !== 0) applyClarity(ctx, w, h, clarity);

  // 3. Single pixel pass: tonal ranges, vibrance, temperature, tint, fade, grain.
  const needsPixelPass =
    highlights !== 0 || shadows !== 0 || whites !== 0 || blacks !== 0 ||
    vibrance !== 0 || temperature !== 0 || tint !== 0 || fade !== 0 || grain > 0;
  if (needsPixelPass) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const tempShift = temperature * 1.5;
    const fadeLift = (fade / 100) * 40;
    const grainStrength = (grain / 100) * 30;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Highlights: bright regions.
      if (highlights !== 0) {
        const hlW = Math.max(0, lum - 0.5) * 2;
        const adj = highlights * hlW * 2.55;
        r += adj; g += adj; b += adj;
      }
      // Shadows: dark regions.
      if (shadows !== 0) {
        const shW = Math.max(0, 0.5 - lum) * 2;
        const adj = shadows * shW * 2.55;
        r += adj; g += adj; b += adj;
      }
      // Whites: very bright.
      if (whites !== 0) {
        const wW = Math.max(0, (lum - 0.7) / 0.3);
        const adj = whites * wW * 2.55;
        r += adj; g += adj; b += adj;
      }
      // Blacks: very dark.
      if (blacks !== 0) {
        const bW = Math.max(0, (0.3 - lum) / 0.3);
        const adj = blacks * bW * 2.55;
        r += adj; g += adj; b += adj;
      }
      // Vibrance: smart saturation — boosts less-saturated colors more.
      if (vibrance !== 0) {
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const sat = (mx - mn) / 255;
        const vibF = 1 + (vibrance / 100) * (1 - sat * 0.6);
        const avg = (r + g + b) / 3;
        r = avg + (r - avg) * vibF;
        g = avg + (g - avg) * vibF;
        b = avg + (b - avg) * vibF;
      }
      // Temperature: warm highlights / cool shadows.
      if (temperature !== 0) {
        const hlF = lum;
        const shF = 1 - lum;
        r += tempShift * hlF - tempShift * 0.3 * shF;
        b -= tempShift * hlF - tempShift * 0.3 * shF;
      }
      // Tint: green/magenta.
      if (tint !== 0) {
        r += tint * 0.8;
        g -= tint * 0.8;
      }
      // Fade: lifted blacks (matte film look).
      if (fade !== 0) {
        const lift = fadeLift * (1 - lum * 0.3);
        r += lift; g += lift; b += lift;
      }
      // Grain: deterministic film grain.
      if (grain > 0) {
        const noise = (hashNoise(p) - 0.5) * grainStrength;
        r += noise; g += noise; b += noise;
      }

      data[i] = clamp(r, 0, 255);
      data[i + 1] = clamp(g, 0, 255);
      data[i + 2] = clamp(b, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // 4. Vignette with controllable shape (transition softness).
  if (vignette > 0) {
    const cx = w / 2;
    const cy = h / 2;
    const shape = (vignetteShape || 50) / 100;
    const innerR = Math.min(w, h) * (0.15 + shape * 0.25);
    const outerR = Math.max(w, h) * (0.55 + shape * 0.25);
    const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}