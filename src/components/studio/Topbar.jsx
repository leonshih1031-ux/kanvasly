import React from "react";
import { Download, Bookmark } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

const MODES = [
  { key: "studio", label: "Product Studio" },
  { key: "retouch", label: "Enhancement Suite" },
  { key: "batch", label: "Batch" },
];

export default function Topbar({ mode, onModeChange, hasImage, onExportClick, onPresetsClick }) {
  return (
    <header className="kv-topbar">
      <div className="flex items-center gap-2.5">
        <Logo size={30} />
        <span className="text-[17px] font-bold tracking-tight text-kanvasly-primary-text">
          Kanvasly
        </span>
      </div>

      <nav className="kv-mode-switcher">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => onModeChange(m.key)}
            className={cn("kv-mode-btn", mode === m.key && "kv-mode-btn-active")}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button
          onClick={onPresetsClick}
          className="kv-btn-secondary"
          style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <Bookmark size={15} />
          Presets
        </button>
        <button
          onClick={onExportClick}
          disabled={!hasImage}
          className={cn(
            "kv-export-top",
            !hasImage && "opacity-40 pointer-events-none"
          )}
        >
          <Download size={15} />
          Export
        </button>
      </div>
    </header>
  );
}