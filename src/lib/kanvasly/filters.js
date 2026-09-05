import { applyRelighting } from "./relighting";

// Apple-camera-style filters. Each is a full set of adjustment values applied
// as a base look; the user can then fine-tune via the Adjust tool.
export const cameraFilters = {
  original: { brightness: 100, contrast: 100, saturation: 100, exposure: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, vibrance: 0, clarity: 0, fade: 0, grain: 0, temperature: 0, tint: 0, vignette: 0, vignetteShape: 50 },
  vivid: { brightness: 102, contrast: 112, saturation: 122, vibrance: 35, clarity: 10, temperature: 0, tint: 0, vignette: 0, vignetteShape: 50 },
  vividWarm: { brightness: 103, contrast: 110, saturation: 120, vibrance: 30, temperature: 18, tint: 4, clarity: 8, vignette: 0, vignetteShape: 50 },
  vividCool: { brightness: 103, contrast: 110, saturation: 120, vibrance: 30, temperature: -18, tint: -4, clarity: 8, vignette: 0, vignetteShape: 50 },
  dramatic: { brightness: 96, contrast: 128, saturation: 85, clarity: 28, shadows: 12, highlights: -10, vignette: 15, vignetteShape: 45, temperature: 0, tint: 0 },
  dramaticWarm: { brightness: 97, contrast: 126, saturation: 88, clarity: 25, temperature: 16, tint: 4, vignette: 15, vignetteShape: 45 },
  dramaticCool: { brightness: 97, contrast: 126, saturation: 88, clarity: 25, temperature: -16, tint: -4, vignette: 15, vignetteShape: 45 },
  richContrast: { brightness: 100, contrast: 124, saturation: 106, vibrance: 14, clarity: 18, highlights: -22, shadows: 16, vignette: 8, vignetteShape: 50, temperature: 0, tint: 0 },
  amber: { brightness: 105, contrast: 104, saturation: 116, vibrance: 18, temperature: 35, tint: 6, highlights: -8, shadows: 6, vignette: 0, vignetteShape: 50 },
  goldenBrown: { brightness: 102, contrast: 96, saturation: 122, vibrance: 16, temperature: 42, tint: 10, fade: 14, shadows: 8, vignette: 6, vignetteShape: 50 },
  vintage: { brightness: 104, contrast: 96, saturation: 86, vibrance: 10, temperature: 14, tint: 6, fade: 26, grain: 22, vignette: 20, vignetteShape: 45, clarity: 6 },
  mono: { brightness: 100, contrast: 105, saturation: 0, exposure: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, vibrance: 0, clarity: 0, fade: 0, grain: 0, temperature: 0, tint: 0, vignette: 0, vignetteShape: 50 },
  silvertone: { brightness: 106, contrast: 112, saturation: 0, fade: 8, clarity: 8, vignette: 0, vignetteShape: 50 },
  noir: { brightness: 92, contrast: 140, saturation: 0, vignette: 30, vignetteShape: 40, clarity: 12 },
};

export const cameraFilterList = [
  { key: "original", label: "Original" },
  { key: "vivid", label: "Vivid" },
  { key: "vividWarm", label: "Vivid Warm" },
  { key: "vividCool", label: "Vivid Cool" },
  { key: "dramatic", label: "Dramatic" },
  { key: "dramaticWarm", label: "Dramatic Warm" },
  { key: "dramaticCool", label: "Dramatic Cool" },
  { key: "richContrast", label: "Rich Contrast" },
  { key: "amber", label: "Amber" },
  { key: "goldenBrown", label: "Golden Brown" },
  { key: "vintage", label: "Vintage" },
  { key: "mono", label: "Mono" },
  { key: "silvertone", label: "Silvertone" },
  { key: "noir", label: "Noir" },
];

// Generate small thumbnail previews of each filter applied to the source image.
export function generateFilterThumbnails(sourceImage, maxSize = 120) {
  if (!sourceImage) return {};
  const scale = Math.min(maxSize / sourceImage.naturalWidth, maxSize / sourceImage.naturalHeight, 1);
  const tw = Math.max(1, Math.round(sourceImage.naturalWidth * scale));
  const th = Math.max(1, Math.round(sourceImage.naturalHeight * scale));
  const thumbs = {};
  for (const key of Object.keys(cameraFilters)) {
    try {
      const c = document.createElement("canvas");
      c.width = tw;
      c.height = th;
      const cx = c.getContext("2d");
      cx.drawImage(sourceImage, 0, 0, tw, th);
      applyRelighting(c, cameraFilters[key]);
      thumbs[key] = c.toDataURL("image/jpeg", 0.8);
    } catch (_) {}
  }
  return thumbs;
}