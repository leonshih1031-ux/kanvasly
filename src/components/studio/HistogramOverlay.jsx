import React, { useEffect, useState } from "react";
import { readExif } from "@/lib/kanvasly/exif";

// Pro-grade overlay: a miniature live luminance histogram computed from the
// canvas, plus a brief EXIF / info strip (ISO, focal length, aperture) read
// from the original JPEG file.
export default function HistogramOverlay({ canvasRef, originalFile, visible }) {
  const [hist, setHist] = useState(null);
  const [exif, setExif] = useState(null);
  const [dims, setDims] = useState(null);

  useEffect(() => {
    setExif(null);
    if (!originalFile) return;
    let alive = true;
    readExif(originalFile).then((e) => { if (alive) setExif(e); });
    return () => { alive = false; };
  }, [originalFile]);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.width || !alive) return;
      try {
        const sw = 128;
        const sh = Math.max(1, Math.round((128 * canvas.height) / canvas.width));
        const sample = document.createElement("canvas");
        sample.width = sw;
        sample.height = sh;
        const sctx = sample.getContext("2d");
        sctx.drawImage(canvas, 0, 0, sw, sh);
        const data = sctx.getImageData(0, 0, sw, sh).data;
        const bins = new Uint32Array(256);
        for (let i = 0; i < data.length; i += 4) {
          const lum = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          bins[lum]++;
        }
        let max = 1;
        for (let i = 1; i < 256; i++) if (bins[i] > max) max = bins[i];
        setHist({ bins: Array.from(bins), max });
        setDims({ w: canvas.width, h: canvas.height });
      } catch (e) {}
    };
    const id = setInterval(tick, 400);
    tick();
    return () => { alive = false; clearInterval(id); };
  }, [visible, canvasRef]);

  if (!visible) return null;
  const bins = hist?.bins;
  const max = hist?.max || 1;

  const exifParts = [];
  if (exif?.iso) exifParts.push(`ISO ${exif.iso}`);
  if (exif?.focalLength) exifParts.push(exif.focalLength);
  if (exif?.aperture) exifParts.push(exif.aperture);
  if (exif?.exposure) exifParts.push(exif.exposure);
  const infoText = exifParts.length
    ? exifParts.join("  ·  ")
    : dims
      ? `${dims.w} × ${dims.h}`
      : "";

  return (
    <div className="kv-histogram-overlay">
      {bins && (
        <svg className="kv-histogram" viewBox="0 0 256 40" preserveAspectRatio="none">
          {bins.map((v, i) => {
            const h = Math.min(34, (v / max) * 34);
            return <rect key={i} x={i} y={36 - h} width={1} height={h} fill="rgba(232,232,232,0.5)" />;
          })}
        </svg>
      )}
      {infoText && <div className="kv-exif-strip">{infoText}</div>}
    </div>
  );
}