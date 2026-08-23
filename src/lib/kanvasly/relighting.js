import { clamp } from "./utils";

export const lightingPresets = {
  warm: { brightness: 105, contrast: 105, saturation: 115, temperature: 15, vignette: 10 },
  cool: { brightness: 100, contrast: 110, saturation: 90, temperature: -15, vignette: 5 },
  golden: { brightness: 110, contrast: 95, saturation: 130, temperature: 30, vignette: 20 },
  overcast: { brightness: 95, contrast: 85, saturation: 80, temperature: -5, vignette: 0 },
  dramatic: { brightness: 90, contrast: 130, saturation: 110, temperature: 0, vignette: 35 },
  neutral: { brightness: 100, contrast: 100, saturation: 100, temperature: 0, vignette: 0 },
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
  const { brightness, contrast, saturation, temperature, vignette } = settings;

  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext("2d");
  tctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  tctx.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(temp, 0, 0);

  if (temperature !== 0) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const shift = temperature * 2;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] + shift, 0, 255);
      data[i + 2] = clamp(data[i + 2] - shift, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (vignette > 0) {
    const cx = w / 2;
    const cy = h / 2;
    const innerR = Math.min(w, h) * 0.3;
    const outerR = Math.max(w, h) * 0.75;
    const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}