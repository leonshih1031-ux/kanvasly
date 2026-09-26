import React from "react";
import {
  Upload, Scissors, Image as ImageIcon, Sun, Box, User, Download,
  Wand2, Sliders, Aperture, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const STUDIO_STEPS = [
  { key: "upload", label: "Upload product", icon: Upload },
  { key: "remove-bg", label: "Remove background", icon: Scissors },
  { key: "backdrop", label: "Background Studio", icon: ImageIcon },
  { key: "effects", label: "Shadow & reflection", icon: Sun },
  { key: "catalog", label: "Multi-angle catalog", icon: Box },
  { key: "on-model", label: "On-model placement", icon: User },
  { key: "export", label: "Export", icon: Download },
];

export const RETOUCH_TOOLS = [
  { key: "filters", label: "Filters", icon: Wand2 },
  { key: "adjust", label: "Adjust", icon: Sliders },
  { key: "bokeh", label: "Bokeh / depth", icon: Aperture },
  { key: "retouch", label: "Retouch", icon: Sparkles },
  { key: "export", label: "Export", icon: Download },
];

export default function Sidebar({ mode, current, onSelect }) {
  const items = mode === "studio" ? STUDIO_STEPS : RETOUCH_TOOLS;
  return (
    <aside className="kv-sidebar">
      <div className="kv-sidebar-section">
        <h3 className="kv-sidebar-title">{mode === "studio" ? "Workflow" : "Tools"}</h3>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              data-key={item.key}
              onClick={() => onSelect(item.key)}
              className={cn("kv-step", current === item.key && "kv-step-active")}
            >
              <span className="kv-step-icon">
                <Icon size={15} strokeWidth={1.5} />
              </span>
              <span className="kv-step-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}