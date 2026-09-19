import React, { useRef, useState } from "react";
import { UploadCloud, SplitSquareHorizontal, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import CompareSlider from "@/components/studio/CompareSlider";

export default function CanvasArea({
  hasImage,
  onFile,
  processing,
  processingText,
  progress,
  canvasRef,
  originalImage,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [compare, setCompare] = useState(false);
  const [zoom, setZoom] = useState(1);

  const zoomIn = () => setZoom((z) => Math.min(8, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)));
  const fit = () => setZoom(1);
  const onWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setZoom((z) => Math.max(0.25, Math.min(8, +(z + delta).toFixed(2))));
    }
  };

  const handleFiles = (files) => {
    if (files && files.length > 0) onFile(files[0]);
  };

  return (
    <main className="kv-canvas-area">
      {!hasImage && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn("kv-upload-zone", dragging && "kv-upload-zone-drag")}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="kv-upload-icon-wrap">
              <UploadCloud size={30} className="text-kanvasly-accent" />
            </div>
            <div className="text-center">
              <h2 className="text-[18px] font-semibold text-kanvasly-primary-text">
                Drop your image here
              </h2>
              <p className="text-[14px] text-kanvasly-tertiary">or click to browse</p>
            </div>
            <p className="text-[11px] text-kanvasly-tertiary mt-1">
              PNG, JPG, HEIC, WebP — up to 20MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,image/heif,image/heic,.heic,.heif,.HEIC,.HEIF"
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {hasImage && (
        <div className="kv-canvas-container" onWheel={onWheel}>
          <canvas ref={canvasRef} className="kv-main-canvas" style={{ zoom }} />
          {hasImage && !processing && (
            <div className="kv-zoom-bar">
              <button onClick={zoomOut} className="kv-zoom-btn" title="Zoom out"><Minus size={14} /></button>
              <button onClick={fit} className="kv-zoom-pct" title="Reset zoom">{Math.round(zoom * 100)}%</button>
              <button onClick={zoomIn} className="kv-zoom-btn" title="Zoom in"><Plus size={14} /></button>
            </div>
          )}
          {compare && !processing && originalImage && (
            <CompareSlider originalImage={originalImage} canvasRef={canvasRef} />
          )}
          {hasImage && !processing && (
            <button
              type="button"
              className={cn("kv-compare-toggle", compare && "kv-compare-toggle-active")}
              onClick={() => setCompare((c) => !c)}
            >
              <SplitSquareHorizontal size={15} />
              {compare ? "Hide compare" : "Compare"}
            </button>
          )}
          {processing && (
            <div className="kv-processing-overlay">
              <div className="kv-spinner" />
              <p className="text-[14px] font-medium text-kanvasly-secondary">
                {processingText}
              </p>
              {progress !== null && (
                <div className="kv-progress-bar">
                  <div className="kv-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}