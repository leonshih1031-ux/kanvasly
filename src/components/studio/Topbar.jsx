import React from "react";
import { Download, Bookmark, Undo2, Redo2, FileText } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

const MODES = [
  { key: "studio", label: "Product Studio" },
  { key: "retouch", label: "Enhancement Suite" },
  { key: "batch", label: "Batch" },
];

export default function Topbar({ mode, onModeChange, hasImage, onExportClick, onPresetsClick, onListingClick, canUndo, canRedo, onUndo, onRedo }) {
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
        <div className="kv-icon-group">
          <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="kv-icon-btn">
            <Undo2 size={15} />
          </button>
          <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" className="kv-icon-btn">
            <Redo2 size={15} />
          </button>
        </div>
        <button
          onClick={onListingClick}
          disabled={!hasImage}
          className={cn("kv-btn-secondary", !hasImage && "opacity-40 pointer-events-none")}
          style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <FileText size={15} />
          Listing
        </button>
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