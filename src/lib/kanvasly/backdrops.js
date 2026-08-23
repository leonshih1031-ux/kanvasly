import { createCanvas, clamp } from "./utils";

const generators = {
  "studio-white": (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(1, "#E8E8E8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  },
  "studio-grey": (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#D0D0D0");
    grad.addColorStop(1, "#A8A8A8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  },
  "studio-gradient": (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#FAFAFA");
    grad.addColorStop(0.5, "#E0E0E0");
    grad.addColorStop(1, "#C0C0C0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  },
  "lifestyle-warm": (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
    grad.addColorStop(0, "#F5E6CA");
    grad.addColorStop(0.6, "#E8D0A8");
    grad.addColorStop(1, "#D4B888");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      d[i] = clamp(d[i] + noise, 0, 255);
      d[i + 1] = clamp(d[i + 1] + noise, 0, 255);
      d[i + 2] = clamp(d[i + 2] + noise, 0, 255);
    }
    ctx.putImageData(imgData, 0, 0);
  },
  "lifestyle-wood": (ctx, w, h) => {
    ctx.fillStyle = "#8B6F47";
    ctx.fillRect(0, 0, w, h);
    const plankW = w / 5;
    for (let i = 0; i < 5; i++) {
      const x = i * plankW;
      const shade = 0.85 + Math.random() * 0.3;
      ctx.fillStyle = `rgb(${Math.round(139 * shade)}, ${Math.round(111 * shade)}, ${Math.round(71 * shade)})`;
      ctx.fillRect(x + 1, 0, plankW - 2, h);
      ctx.strokeStyle = "rgba(60, 40, 20, 0.15)";
      ctx.lineWidth = 1;
      for (let j = 0; j < 12; j++) {
        ctx.beginPath();
        const yLine = Math.random() * h;
        ctx.moveTo(x, yLine);
        ctx.bezierCurveTo(
          x + plankW * 0.3, yLine + (Math.random() - 0.5) * 10,
          x + plankW * 0.7, yLine + (Math.random() - 0.5) * 10,
          x + plankW, yLine + (Math.random() - 0.5) * 5
        );
        ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(40, 25, 10, 0.4)";
    for (let i = 1; i < 5; i++) ctx.fillRect(i * plankW - 1, 0, 2, h);
  },
  "outdoor-sky": (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#4A90D9");
    grad.addColorStop(0.6, "#87CEEB");
    grad.addColorStop(1, "#B0E0E6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < 5; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h * 0.4;
      const r = 20 + Math.random() * 40;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.7, cy + 5, r * 0.8, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.7, cy + 5, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  "outdoor-nature": (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#7DBE6E");
    grad.addColorStop(1, "#4A8B3A");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      d[i] = clamp(d[i] + noise, 0, 255);
      d[i + 1] = clamp(d[i + 1] + noise, 0, 255);
      d[i + 2] = clamp(d[i + 2] + noise * 0.5, 0, 255);
    }
    ctx.putImageData(imgData, 0, 0);
  },
  "abstract-purple": (ctx, w, h) => {
    ctx.fillStyle = "#1A1033";
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, "rgba(83, 74, 183, 0.6)");
    grad.addColorStop(0.5, "rgba(60, 52, 137, 0.3)");
    grad.addColorStop(1, "rgba(26, 16, 51, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const grad2 = ctx.createRadialGradient(w * 0.7, h * 0.7, 0, w * 0.7, h * 0.7, Math.max(w, h) * 0.5);
    grad2.addColorStop(0, "rgba(15, 110, 86, 0.3)");
    grad2.addColorStop(1, "rgba(15, 110, 86, 0)");
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, h);
  },
  "abstract-geometric": (ctx, w, h) => {
    ctx.fillStyle = "#0E0B1A";
    ctx.fillRect(0, 0, w, h);
    const colors = ["#534AB7", "#0F6E56", "#6B62D6", "#14A082"];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.15 + Math.random() * 0.15;
      ctx.beginPath();
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const r = 40 + Math.random() * 120;
      const shape = Math.floor(Math.random() * 3);
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