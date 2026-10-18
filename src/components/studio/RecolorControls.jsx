import React, { useState } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

function Hint({ children }) {
  return <p className="kv-hint">{children}</p>;
}

const SWATCHES = [
  { name: "Matte black", value: "matte black" },
  { name: "Glossy white", value: "glossy white" },
  { name: "Gold", value: "metallic gold" },
  { name: "Rose gold", value: "rose gold" },
  { name: "Silver", value: "brushed silver" },
  { name: "Sage green", value: "sage green" },
  { name: "Navy blue", value: "navy blue" },
  { name: "Coral", value: "coral pink" },
  { name: "Burgundy", value: "burgundy red" },
  { name: "Champagne", value: "champagne beige" },
  { name: "Emerald", value: "emerald green" },
  { name: "Lavender", value: "lavender purple" },
];

export default function RecolorControls({ onRecolor, aiGenerating }) {
  const [custom, setCustom] = useState("");

  return (
    <div className="kv-control-group">
      <div className="flex items-center gap-2 mb-1">
        <Palette size={15} className="text-kanvasly-accent" />
        <h3 className="text-[14px] font-semibold text-kanvasly-primary-text">Recolor product</h3>
      </div>
      <Hint>
        Change your product's color or finish while keeping its exact shape, material
        texture, and logos. Perfect for showing one product in multiple colorways.
      </Hint>
      <div className="grid grid-cols-3 gap-1.5">
        {SWATCHES.map((s) => (
          <button
            key={s.value}
            type="button"
            disabled={aiGenerating}
            onClick={() => onRecolor(s.value)}
            className={cn(
              "kv-option",
              aiGenerating && "opacity-40 pointer-events-none"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] text-kanvasly-secondary">Or describe a custom color</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="kv-input"
            placeholder="e.g. turquoise with matte finish"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && custom.trim() && !aiGenerating) onRecolor(custom.trim());
            }}
          />
          <button
            type="button"
            className="kv-btn-primary"
            onClick={() => onRecolor(custom.trim())}
            disabled={!custom.trim() || aiGenerating}
          >
            {aiGenerating ? "…" : "Go"}
          </button>
        </div>
      </div>
    </div>
  );
}