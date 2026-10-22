import React from "react";
import { Keyboard, X } from "lucide-react";
import { MOD_LABEL, SHIFT_LABEL } from "@/hooks/useKeyboardShortcuts";

const GROUPS = [
  {
    title: "History",
    items: [
      { combo: `${MOD_LABEL}+Z`, label: "Undo" },
      { combo: `${MOD_LABEL}+${SHIFT_LABEL}+Z`, label: "Redo" },
    ],
  },
  {
    title: "Navigate",
    items: [
      { combo: "1 – 9", label: "Jump to a tool or step" },
      { combo: "[  ]", label: "Previous / next tool" },
      { combo: `${MOD_LABEL}+1 2 3`, label: "Switch workspace" },
      { combo: `${MOD_LABEL}+↵`, label: "Next step" },
    ],
  },
  {
    title: "Actions",
    items: [
      { combo: `${MOD_LABEL}+S`, label: "Export image" },
      { combo: "?", label: "Show shortcuts" },
      { combo: "Esc", label: "Close dialog" },
    ],
  },
];

const chip = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 24,
  padding: "0 9px",
  background: "var(--kv-input)",
  border: "1px solid var(--kv-border-strong)",
  borderRadius: 7,
  fontSize: 11,
  fontWeight: 600,
  color: "var(--kv-text)",
  whiteSpace: "nowrap",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

export default function ShortcutsModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(11, 9, 24, 0.7)",
        backdropFilter: "blur(6px)", zIndex: 210, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px, 92vw)", maxHeight: "84vh", background: "var(--kv-surface)",
          border: "1px solid var(--kv-border-strong)", borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)", display: "flex",
          flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--kv-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Keyboard size={16} className="text-kanvasly-accent" />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--kv-text)" }}>Keyboard shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--kv-text-tertiary)", cursor: "pointer", padding: 4, borderRadius: 8 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 18px 20px", flex: 1 }}>
          {GROUPS.map((g, gi) => (
            <div key={g.title} style={{ marginTop: gi === 0 ? 0 : 20 }}>
              <div
                style={{
                  fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.06em", color: "var(--kv-text-tertiary)", marginBottom: 10,
                }}
              >
                {g.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {g.items.map((it) => (
                  <div
                    key={it.label}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                  >
                    <span style={{ fontSize: 13, color: "var(--kv-text-secondary)" }}>{it.label}</span>
                    <span style={chip}>{it.combo}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}