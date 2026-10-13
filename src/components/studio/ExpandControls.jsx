import React, { useState } from "react";
import { Expand } from "lucide-react";
import { cn } from "@/lib/utils";

const RATIOS = [
  { key: "1:1", label: "1:1 Square" },
  { key: "4:5", label: "4:5 Portrait" },
  { key: "9:16", label: "9:16 Story" },
  { key: "4:3", label: "4:3" },
  { key: "3:2", label: "3:2" },
  { key: "16:9", label: "16:9 Wide" },
];

function PanelHeader({ icon: Icon, title, children }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={15} className="text-kanvasly-accent" />
        <h3 className="text-[14px] font-semibold text-kanvasly-primary-text">{title}</h3>
      </div>
      {children}
    </>
  );
}
function Hint({ children }) {
  return <p className="kv-hint">{children}</p>;
}

export default function ExpandControls({ onExpand, aiGenerating }) {
  const [ratio, setRatio] = useState("16:9");
  const [prompt, setPrompt] = useState("");

  return (
    <div className="kv-control-group">
      <PanelHeader icon={Expand} title="Expand canvas" />
      <Hint>
        Uncrop your image to any aspect ratio. AI extends the scene beyond the frame,
        keeping your product unchanged — perfect for stories, banners, and wide thumbnails.
      </Hint>
      <div className="grid grid-cols-3 gap-1.5">
        {RATIOS.map((r) => (
          <button
            key={r.key}
            onClick={() => setRatio(r.key)}
            className={cn("kv-option", ratio === r.key && "kv-option-active")}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] text-kanvasly-secondary">Optional guidance</label>
        <input
          type="text"
          className="kv-input"
          placeholder="e.g. add soft pink gradient background"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <button className="kv-btn-primary kv-btn-full" onClick={() => onExpand(ratio, prompt)} disabled={aiGenerating}>
        {aiGenerating ? "Expanding…" : "Expand image"}
      </button>
    </div>
  );
}