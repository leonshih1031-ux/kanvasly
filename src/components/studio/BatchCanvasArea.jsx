import React, { useRef, useState } from "react";
import { Images, FolderOpen, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BatchCanvasArea({
  hasItems,
  onFiles,
  processing,
  processingText,
  progress,
  canvasRef,
}) {
  const imgInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (e, ref) => {
    e.stopPropagation();
    ref.current?.click();
  };

  return (
    <main className="kv-canvas-area">
      {!hasItems && (
        <div
          onClick={() => imgInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFiles(e.dataTransfer.files);
          }}
          className={cn("kv-upload-zone", dragging && "kv-upload-zone-drag")}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="kv-upload-icon-wrap">
              <Images size={30} className="text-kanvasly-accent" />
            </div>
            <div className="text-center">
              <h2 className="text-[18px] font-semibold text-kanvasly-primary-text">
                Drop images or a folder here
              </h2>
              <p className="text-[14px] text-kanvasly-tertiary">or choose below</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="kv-btn-primary" onClick={(e) => pick(e, imgInputRef)}>
                <span className="inline-flex items-center gap-1.5">
                  <FileImage size={15} /> Select images
                </span>
              </button>
              <button type="button" className="kv-btn-secondary" onClick={(e) => pick(e, folderInputRef)}>
                <span className="inline-flex items-center gap-1.5">
                  <FolderOpen size={15} /> Select folder
                </span>
              </button>
            </div>
            <p className="text-[11px] text-kanvasly-tertiary mt-1">
              PNG, JPG, HEIC, WebP — up to 20MB each
            </p>
          </div>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files.length) onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            {...{ webkitdirectory: "", directory: "" }}
            hidden
            onChange={(e) => {
              if (e.target.files.length) onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {hasItems && (
        <div className="kv-canvas-container">
          <canvas ref={canvasRef} className="kv-main-canvas" />
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