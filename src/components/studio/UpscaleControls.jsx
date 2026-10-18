import React, { useState } from "react";
import { Maximize2 } from "lucide-react";
import Slider from "./Slider";
import { cn } from "@/lib/utils";

function Hint({ children }) {
  return <p className="kv-hint">{children}</p>;
}

const SCALES = [
  { value: 2, label: "2×" },
  { value: 3, label: "3×" },
  { value: 4, label: "4×" },
];

export default function UpscaleControls({ onUpscale, processing, canvasSize }) {
  const [scale, setScale] = useState(2);
  const [sharpen, setSharpen] = useState(35);

  const targetW = canvasSize?.w ? Math.round(canvasSize.w * scale) : 0;
  const targetH = canvasSize?.h ? Math.round(canvasSize.h * scale) : 0;

  return (
    <div className="kv-control-group">
      <div className="flex items-center gap-2 mb-1">
        <Maximize2 size={15} className="text-kanvasly-accent" />
        <h3 className="text-[14px] font-semibold text-kanvasly-primary-text">Upscale</h3>
      </div>
      <Hint>
        Enlarge your image up to 4× with high-quality resampling and edge
        sharpening — crisp results for print and large marketplace listings. Runs
        instantly on your device.
      </Hint>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] text-kanvasly-secondary">Scale</label>
        <div className="grid grid-cols-3 gap-1.5">
          {SCALES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScale(s.value)}
              className={cn("kv-option", scale === s.value && "kv-option-active")}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <Slider
        label="Sharpen"
        value={sharpen}
        min={0}
        max={100}
        unit="%"
        onChange={setSharpen}
      />
      {targetW > 0 && (
        <div className="text-[11px] text-kanvasly-tertiary tabular-nums">
          Output: {targetW} × {targetH}px
        </div>
      )}
      <button
        className="kv-btn-primary kv-btn-full"
        onClick={() => onUpscale(scale, sharpen)}
        disabled={processing}
      >
        {processing ? "Upscaling…" : "Upscale image"}
      </button>
    </div>
  );
}