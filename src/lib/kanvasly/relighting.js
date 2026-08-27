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

export function applyRelighting(canvas, settings) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const { brightness, contrast, saturation, temperature, tint, vignette, vignetteShape } = settings;

  // CSS filter pass: brightness, contrast, saturation.
  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext("2d");
  tctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  tctx.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(temp, 0, 0);

  // Color temperature: warm highlights (add red, reduce blue) + cool shadows
  // (add blue, reduce red) for realistic color grading instead of a flat tint.
  if (temperature !== 0) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const shift = temperature * 1.5;
    for (let i = 0; i < data.length; i += 4) {
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      // Warm: highlights get more red/less blue; shadows get less red/more blue.
      const hlFactor = lum; // 0-1
      const shFactor = 1 - lum;
      data[i] = clamp(data[i] + shift * hlFactor - shift * 0.3 * shFactor, 0, 255);
      data[i + 2] = clamp(data[i + 2] - shift * hlFactor + shift * 0.3 * shFactor, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Tint: green/magenta shift.
  if (tint !== 0) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] + tint * 0.8, 0, 255);     // magenta → red up
      data[i + 1] = clamp(data[i + 1] - tint * 0.8, 0, 255); // green down
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Vignette with controllable shape (transition softness).
  if (vignette > 0) {
    const cx = w / 2;
    const cy = h / 2;
    const shape = (vignetteShape || 50) / 100; // 0 = hard, 1 = soft
    const innerR = Math.min(w, h) * (0.15 + shape * 0.25);
    const outerR = Math.max(w, h) * (0.55 + shape * 0.25);
    const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}