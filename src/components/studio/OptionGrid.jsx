import React from "react";
import { cn } from "@/lib/utils";

// A 2-column option grid (backdrops, angles, poses, lighting).
export default function OptionGrid({ options, value, onSelect, columns = 2 }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          className={cn(
            "kv-option",
            value === opt.key && "kv-option-active",
            opt.span && "col-span-2"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}