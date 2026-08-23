import React from "react";

export default function Slider({ label, value, min, max, unit = "", onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between text-[12px] text-kanvasly-secondary">
        <span>{label}</span>
        <span className="font-semibold text-kanvasly-primary-text tabular-nums">
          {value}
          {unit}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="kv-slider"
      />
    </div>
  );
}