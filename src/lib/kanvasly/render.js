import { compositeProduct } from "./compositing";
import { compositeAngle } from "./catalog";
import { generateBackdrop } from "./backdrops";
import { applyRelighting } from "./relighting";
import { applyBokeh } from "./bokeh";
import { applyRetouch } from "./retouch";

// Renders the Product Studio composite onto the main canvas.
export function renderStudio(ctx, canvas, state) {
  if (!canvas || !ctx) return;
  if (!state.productImage) {
    if (state.originalImage) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(state.originalImage, 0, 0, canvas.width, canvas.height);
    }
    return;
  }
  if (state.backdrop && state.backdropImage) {
    const ca = state.catalogAngle || {};
    const hasAngle = (ca.rotation && ca.rotation !== 0) || (ca.scaleY && ca.scaleY !== 1);
    let composited;
    if (hasAngle) {
      composited = compositeAngle(
        state.productImage,
        state.backdropImage,
        ca,
        state.shadow,
        state.reflection,
        state.product,
        state.backdropBlur || 0
      );
    } else {
      composited = compositeProduct(
        state.productImage,
        state.backdropImage,
        state.shadow,
        state.reflection,
        state.product,
        state.backdropBlur || 0
      );
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(composited, 0, 0);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.productImage, 0, 0, canvas.width, canvas.height);
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