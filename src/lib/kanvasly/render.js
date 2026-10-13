import { compositeProduct } from "./compositing";
import { compositeAngle } from "./catalog";
import { generateBackdrop } from "./backdrops";
import { applyRelighting } from "./relighting";
import { applyBokeh } from "./bokeh";
import { applyRetouch } from "./retouch";

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draws user text layers on top of the composite. Position x/y and size are
// percentages of the canvas dimensions so they scale with the image.
export function drawTextLayers(ctx, canvas, layers) {
  if (!layers || !layers.length) return;
  layers.forEach((layer) => {
    if (!layer.text) return;
    const fontSize = Math.max(4, (layer.size / 100) * canvas.height);
    const weight = layer.bold ? "700" : "400";
    const style = layer.italic ? "italic" : "normal";
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, (layer.opacity || 100) / 100));
    ctx.font = `${style} ${weight} ${fontSize}px ${layer.font || "Inter"}, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const px = (layer.x / 100) * canvas.width;
    const py = (layer.y / 100) * canvas.height;
    ctx.translate(px, py);
    ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);

    const lines = String(layer.text).split("\n");
    const lineHeight = fontSize * 1.2;
    const totalH = lines.length * lineHeight;
    let maxW = 0;
    lines.forEach((ln) => { maxW = Math.max(maxW, ctx.measureText(ln).width); });

    if (layer.bg) {
      const pad = ((layer.bgPadding || 0) / 100) * fontSize;
      const w = maxW + pad * 2;
      const h = totalH + pad * 2;
      const r = ((layer.bgRadius || 0) / 100) * fontSize * 0.5;
      ctx.fillStyle = layer.bgColor || "#000000";
      roundRect(ctx, -w / 2, -h / 2, w, h, r);
      ctx.fill();
    }

    if (layer.stroke && (layer.strokeW || 0) > 0) {
      ctx.lineWidth = (layer.strokeW / 100) * fontSize;
      ctx.strokeStyle = layer.strokeColor || "#000000";
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      lines.forEach((ln, i) => {
        const ly = -totalH / 2 + lineHeight / 2 + i * lineHeight;
        ctx.strokeText(ln, 0, ly);
      });
    }

    ctx.fillStyle = layer.color || "#ffffff";
    lines.forEach((ln, i) => {
      const ly = -totalH / 2 + lineHeight / 2 + i * lineHeight;
      ctx.fillText(ln, 0, ly);
    });
    ctx.restore();
  });
}

// Renders the Product Studio composite onto the main canvas.
export function renderStudio(ctx, canvas, state) {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.aiBlended && state.backdropImage) {
    ctx.drawImage(state.backdropImage, 0, 0, canvas.width, canvas.height);
  } else if (state.productImage) {
    if (state.backdrop && state.backdropImage) {
      const ca = state.catalogAngle || {};
      const hasAngle = (ca.rotation && ca.rotation !== 0) || (ca.scaleY && ca.scaleY !== 1);
      const composited = hasAngle
        ? compositeAngle(state.productImage, state.backdropImage, ca, state.shadow, state.reflection, state.product, state.backdropBlur || 0)
        : compositeProduct(state.productImage, state.backdropImage, state.shadow, state.reflection, state.product, state.backdropBlur || 0);
      ctx.drawImage(composited, 0, 0);
    } else {
      ctx.drawImage(state.productImage, 0, 0, canvas.width, canvas.height);
    }
  } else if (state.originalImage) {
    ctx.drawImage(state.originalImage, 0, 0, canvas.width, canvas.height);
  }
  if (state.textLayers && state.textLayers.length) {
    drawTextLayers(ctx, canvas, state.textLayers);
  }
}

// Renders the Enhancement Suite result onto the main canvas.
export function renderRetouch(ctx, canvas, state) {
  if (!canvas || !ctx || !state.originalImage) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const base = state.productImage || state.originalImage;
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
  applyRelighting(canvas, state.relight);
  if (state.bokeh.applied) {
    applyBokeh(canvas, state.bokeh.blur, state.bokeh.focusScale, state.bokeh.focusX, state.bokeh.focusY);
  }
  if (state.retouch.applied) {
    applyRetouch(canvas, {
      dustRemoval: state.retouch.dustRemoval,
      sharpen: state.retouch.sharpen,
      denoise: state.retouch.denoise,
      colorCorrect: state.retouch.colorCorrect,
    });
  }
}

export function ensureBackdrop(state) {
  if (!state.backdropImage && state.canvas) {
    return generateBackdrop(state.backdrop, state.canvas.width, state.canvas.height);
  }
  return state.backdropImage;
}