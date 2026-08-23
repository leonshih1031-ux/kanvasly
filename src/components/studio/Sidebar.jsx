import React from "react";
import { cn } from "@/lib/utils";

export const STUDIO_STEPS = [
  { key: "upload", label: "Upload product" },
  { key: "remove-bg", label: "Remove background" },
  { key: "backdrop", label: "Choose backdrop" },
  { key: "effects", label: "Shadow & reflection" },
  { key: "catalog", label: "Multi-angle catalog" },
  { key: "on-model", label: "On-model placement" },
  { key: "export", label: "Export" },
];

export const RETOUCH_TOOLS = [
  { key: "bg-remove", label: "Background removal" },
  { key: "bokeh", label: "Bokeh / depth" },
  { key: "relight", label: "Weather & lighting" },
  { key: "retouch", label: "Portrait retouch" },
  { key: "export", label: "Export" },
];

export default function Sidebar({ mode, current, onSelect }) {
  const items = mode === "studio" ? STUDIO_STEPS : RETOUCH_TOOLS;
  return (
    <aside className="kv-sidebar">
      <div className="kv-sidebar-section">
        <h3 className="kv-sidebar-title">{mode === "studio" ? "Workflow" : "Tools"}</h3>
        {items.map((item, i) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={cn("kv-step", current === item.key && "kv-step-active")}
          >
            <span className="kv-step-num">{i + 1}</span>
            <span className="kv-step-label">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}