// Pure canvas/image utilities for the Kanvasly engine.

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (typeof createImageBitmap !== "undefined" && file.type.match(/heic|heif/i)) {
          createImageBitmap(file).then((bitmap) => {
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            canvas.getContext("2d").drawImage(bitmap, 0, 0);
            const img2 = new Image();
            img2.onload = () => resolve(img2);
            img2.onerror = reject;
            img2.src = canvas.toDataURL("image/png");
          }).catch(reject);
        } else {
          reject(new Error("Unsupported format"));
        }
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

export function imageToBlob(img, maxW = 1024) {
  return new Promise((resolve) => {
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (Math.max(w, h) > maxW) {
      const scale = maxW / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    c.toBlob(resolve, "image/png");
  });
}

export function createCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { canvas: c, ctx: c.getContext("2d") };
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function debounce(fn, delay) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function canvasToBlob(canvas, format = "image/png", quality = 0.92) {
  return new Promise((resolve) => canvas.toBlob(resolve, format, quality));
}