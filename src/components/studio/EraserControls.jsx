import React from "react";
import { Eraser, Trash2 } from "lucide-react";
import Slider from "./Slider";

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

export default function EraserControls({ brushSize, setBrushSize, onErase, onClear, processing }) {
  return (
    <div className="kv-control-group">
      <PanelHeader icon={Eraser} title="Magic eraser" />
      <Hint>
        Brush over anything you want removed — people, objects, blemishes, or logos —
        then tap Erase. AI fills the area naturally from the surrounding background.
      </Hint>
      <Slider label="Brush size" value={brushSize} min={2} max={40} unit="px" onChange={setBrushSize} />
      <button className="kv-btn-primary kv-btn-full" onClick={onErase} disabled={processing}>
        {processing ? "Removing…" : "Erase marked areas"}
      </button>
      <button
        className="kv-btn-secondary kv-btn-full"
        onClick={onClear}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}
      >
        <Trash2 size={15} /> Clear marks
      </button>
    </div>
  );
}