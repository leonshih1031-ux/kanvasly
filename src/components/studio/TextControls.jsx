import React from "react";
import { Type, Trash2, Plus } from "lucide-react";
import Slider from "./Slider";
import { cn } from "@/lib/utils";

const FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Georgia", label: "Georgia" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Arial Black", label: "Arial Black" },
  { value: "Impact", label: "Impact" },
  { value: "Courier New", label: "Courier" },
  { value: "Times New Roman", label: "Times" },
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

export default function TextControls({ layers, selectedId, onAdd, onUpdate, onDelete, onSelect }) {
  const selected = layers.find((l) => l.id === selectedId) || null;

  return (
    <div className="kv-control-group">
      <PanelHeader icon={Type} title="Text & typography" />
      <Hint>
        Add headlines, prices, promo badges, or watermarks. Drag on the canvas to
        reposition the selected text layer.
      </Hint>
      <button
        className="kv-btn-secondary kv-btn-full"
        onClick={onAdd}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}
      >
        <Plus size={15} /> Add text layer
      </button>

      {layers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {layers.map((l) => (
            <div
              key={l.id}
              onClick={() => onSelect(l.id)}
              className={cn("kv-preset", selectedId === l.id && "kv-preset-active")}
              style={{ cursor: "pointer" }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {l.text || "(empty)"}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(l.id); }}
                className="kv-icon-btn"
                style={{ width: 24, height: 24 }}
                title="Delete layer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-kanvasly-secondary">Text</label>
            <textarea
              className="kv-input"
              rows={2}
              value={selected.text}
              onChange={(e) => onUpdate(selected.id, { text: e.target.value })}
              placeholder="Type your text…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-kanvasly-secondary">Font</label>
            <select
              className="kv-select"
              value={selected.font}
              onChange={(e) => onUpdate(selected.id, { font: e.target.value })}
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <Slider label="Size" value={selected.size} min={1} max={30} step={0.5} unit="%" onChange={(v) => onUpdate(selected.id, { size: v })} />
          <div className="flex items-center gap-2">
            <label className="kv-checkbox" style={{ flex: 1 }}>
              <input type="checkbox" checked={selected.bold} onChange={(e) => onUpdate(selected.id, { bold: e.target.checked })} />
              Bold
            </label>
            <label className="kv-checkbox" style={{ flex: 1 }}>
              <input type="checkbox" checked={selected.italic} onChange={(e) => onUpdate(selected.id, { italic: e.target.checked })} />
              Italic
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={selected.color} onChange={(e) => onUpdate(selected.id, { color: e.target.value })} className="kv-color-input" />
            <span className="text-[12px] text-kanvasly-tertiary tabular-nums">{selected.color.toUpperCase()}</span>
          </div>
          <Slider label="Opacity" value={selected.opacity} min={0} max={100} unit="%" onChange={(v) => onUpdate(selected.id, { opacity: v })} />
          <Slider label="Rotation" value={selected.rotation} min={-45} max={45} unit="°" onChange={(v) => onUpdate(selected.id, { rotation: v })} />
          <Slider label="Position X" value={selected.x} min={0} max={100} unit="%" onChange={(v) => onUpdate(selected.id, { x: v })} />
          <Slider label="Position Y" value={selected.y} min={0} max={100} unit="%" onChange={(v) => onUpdate(selected.id, { y: v })} />
          <div className="h-px bg-white/5 my-1" />
          <label className="kv-checkbox">
            <input type="checkbox" checked={selected.bg} onChange={(e) => onUpdate(selected.id, { bg: e.target.checked })} />
            Background pill
          </label>
          {selected.bg && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input type="color" value={selected.bgColor} onChange={(e) => onUpdate(selected.id, { bgColor: e.target.value })} className="kv-color-input" />
                <span className="text-[12px] text-kanvasly-tertiary tabular-nums">{selected.bgColor.toUpperCase()}</span>
              </div>
              <Slider label="Pill padding" value={selected.bgPadding} min={0} max={40} unit="%" onChange={(v) => onUpdate(selected.id, { bgPadding: v })} />
              <Slider label="Pill roundness" value={selected.bgRadius} min={0} max={50} unit="%" onChange={(v) => onUpdate(selected.id, { bgRadius: v })} />
            </div>
          )}
          <label className="kv-checkbox">
            <input type="checkbox" checked={selected.stroke} onChange={(e) => onUpdate(selected.id, { stroke: e.target.checked })} />
            Outline
          </label>
          {selected.stroke && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input type="color" value={selected.strokeColor} onChange={(e) => onUpdate(selected.id, { strokeColor: e.target.value })} className="kv-color-input" />
                <span className="text-[12px] text-kanvasly-tertiary tabular-nums">{selected.strokeColor.toUpperCase()}</span>
              </div>
              <Slider label="Outline width" value={selected.strokeW} min={1} max={20} unit="%" onChange={(v) => onUpdate(selected.id, { strokeW: v })} />
            </div>
          )}
        </>
      )}
    </div>
  );
}