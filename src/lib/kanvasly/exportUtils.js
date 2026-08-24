import { downloadBlob } from "./utils";

export const exportPresets = {
  "shopify-main": { width: 2048, height: 2048, label: "Shopify product", size: "2048 × 2048" },
  "amazon-main": { width: 2000, height: 2000, label: "Amazon main", size: "2000 × 2000" },
  "amazon-list": { width: 1000, height: 1000, label: "Amazon listing", size: "1000 × 1000" },
  "instagram-square": { width: 1080, height: 1080, label: "Instagram square", size: "1080 × 1080" },
  "instagram-story": { width: 1080, height: 1920, label: "Instagram story", size: "1080 × 1920" },
};

export const studioExportList = [
  "shopify-main",
  "amazon-main",
  "amazon-list",
  "instagram-square",
  "instagram-story",
  "custom",
];

export const retouchExportList = ["instagram-square", "instagram-story", "custom"];

export function exportToPreset(sourceCanvas, presetKey, format, quality = 0.92, customW, customH, name) {
  let targetW;
  let targetH;
  if (presetKey === "custom") {
    targetW = customW || 1080;
    targetH = customH || 1080;
  } else {
    const preset = exportPresets[presetKey] || exportPresets["instagram-square"];
    targetW = preset.width;
    targetH = preset.height;
  }

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = targetW;
  exportCanvas.height = targetH;
  const ectx = exportCanvas.getContext("2d");

  if (format === "image/jpeg") {
    ectx.fillStyle = "#FFFFFF";
    ectx.fillRect(0, 0, targetW, targetH);
  }

  const scale = Math.min(targetW / sourceCanvas.width, targetH / sourceCanvas.height);
  const drawW = sourceCanvas.width * scale;
  const drawH = sourceCanvas.height * scale;
  ectx.drawImage(sourceCanvas, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);

  exportCanvas.toBlob((blob) => {
    const ext = format.split("/")[1];
    const filename = name ? `${name}.${ext}` : `kanvasly-${presetKey}-${Date.now()}.${ext}`;
    downloadBlob(blob, filename);
  }, format, quality);
}