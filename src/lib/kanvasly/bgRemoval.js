import { imageToBlob } from "./utils";

let removeBackgroundFn = null;
let loadingPromise = null;

export async function loadBgRemovalLibrary() {
  if (removeBackgroundFn) return removeBackgroundFn;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const mod = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm"
    );
    removeBackgroundFn = mod.removeBackground || mod.default;
    return removeBackgroundFn;
  })();
  return loadingPromise;
}

export function isBgRemovalReady() {
  return !!removeBackgroundFn;
}

export async function removeBackground(imageInput, config = {}, onProgress) {
  await loadBgRemovalLibrary();
  let blob = imageInput;
  if (imageInput instanceof HTMLImageElement) {
    blob = await imageToBlob(imageInput, 1024);
  }
  return await removeBackgroundFn(blob, {
    model: config.model || "isnet_fp16",
    output: { format: "image/png" },
    progress: (key, current, total) => onProgress && onProgress(key, current, total),
    ...config,
  });
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