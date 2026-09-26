import React from "react";

// Fine-line pro slider with signed numeric values (e.g. +50, -10, 0).
export default function Slider({ label, value, min, max, step = 1, unit = "", onChange }) {
  const signed = min < 0;
  const display = signed
    ? `${value > 0 ? "+" : ""}${value}${unit}`
    : `${value}${unit}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between text-[12px] text-kanvasly-secondary">
        <span>{label}</span>
        <span className="font-semibold text-kanvasly-primary-text tabular-nums text-[11px]">
          {display}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="kv-slider"
      />
    </div>
  );
}