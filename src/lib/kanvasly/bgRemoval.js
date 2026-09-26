import { imageToBlob } from "./utils";

let removeBackgroundFn = null;
let preloadFn = null;
let loadingPromise = null;

// Multiple CDNs — if one is blocked/slow (common in some regions), the next is tried.
const CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm",
  "https://esm.sh/@imgly/background-removal@1.7.0",
  "https://unpkg.com/@imgly/background-removal@1.7.0?module",
];

export async function loadBgRemovalLibrary() {
  if (removeBackgroundFn) return removeBackgroundFn;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    let lastErr;
    for (const url of CDN_URLS) {
      try {
        const mod = await import(/* @vite-ignore */ url);
        removeBackgroundFn = mod.removeBackground || mod.default;
        preloadFn = mod.preload;
        return removeBackgroundFn;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Could not load the background-removal library");
  })();
  return loadingPromise;
}

export function isBgRemovalReady() {
  return !!removeBackgroundFn;
}

// Warm the model cache ahead of time so the first real call is fast.
export async function preloadBgRemoval(model = "isnet_quint8") {
  await loadBgRemovalLibrary();
  if (preloadFn) {
    try { await preloadFn({ model }); } catch (e) { /* best-effort */ }
  }
}

export async function removeBackground(imageInput, config = {}, onProgress) {
  await loadBgRemovalLibrary();
  let blob = imageInput;
  if (imageInput instanceof HTMLImageElement) {
    blob = await imageToBlob(imageInput, 1024);
  }
  const model = config.model || "isnet_quint8";

  // Guard against a stalled model download — fail clearly instead of hanging.
  const TIMEOUT_MS = 120000;
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("The AI model is taking too long to download. Check your connection and try again.")),
      TIMEOUT_MS
    );
  });

  try {
    const result = await Promise.race([
      removeBackgroundFn(blob, {
        ...config,
        model,
        output: { format: "image/png" },
        progress: (key, current, total) => onProgress && onProgress(key, current, total),
      }),
      timeoutPromise,
    ]);
    clearTimeout(timer);
    return result;
  } catch (e) {
    clearTimeout(timer);
    const msg = (e && e.message) || "";
    if (/fetch|network|load|failed to fetch/i.test(msg) || e instanceof TypeError) {
      throw new Error("Could not download the AI model — check your connection and try again.");
    }
    throw e;
  }
}

export function featherAlpha(canvas, radius) {
  if (radius <= 0) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);
  const r = Math.ceil(radius);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (original[i + 3] === 0) continue;
      let hasTransparentNeighbor = false;
      for (let dy = -r; dy <= r && !hasTransparentNeighbor; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (original[(ny * w + nx) * 4 + 3] === 0) {
            hasTransparentNeighbor = true;
            break;
          }
        }
      }
      if (hasTransparentNeighbor) {
        data[i + 3] = Math.max(0, data[i + 3] - radius * 20);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}