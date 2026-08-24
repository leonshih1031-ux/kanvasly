import { compositeProduct } from "./compositing";
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
    const composited = compositeProduct(
      state.productImage,
      state.backdropImage,
      state.shadow,
      state.reflection,
      state.product
    );
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(composited, 0, 0);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.productImage, 0, 0, canvas.width, canvas.height);
  }
}

// Renders the Enhancement Suite result onto the main canvas.
// If the background was removed, the isolated product is the base; otherwise
// the original photo is used so bokeh/relight/retouch apply to the full image.
export function renderRetouch(ctx, canvas, state) {
  if (!canvas || !ctx || !state.originalImage) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const base = state.productImage || state.originalImage;
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
  applyRelighting(canvas, state.relight);
  if (state.bokeh.applied) applyBokeh(canvas, state.bokeh.blur, state.bokeh.focusScale);
  if (state.retouch.applied) {
    applyRetouch(canvas, {
      smoothing: state.retouch.smoothing,
      teethWhitening: state.retouch.teethWhitening,
      blemishRemoval: state.retouch.blemishRemoval,
    });
  }
}

export function ensureBackdrop(state) {
  if (!state.backdropImage && state.canvas) {
    return generateBackdrop(state.backdrop, state.canvas.width, state.canvas.height);
  }
  return state.backdropImage;
}