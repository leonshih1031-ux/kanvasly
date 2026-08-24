import React from "react";
import { cn } from "@/lib/utils";
import { Layers, Sparkles, Sun, Download, Images } from "lucide-react";
import Slider from "./Slider";
import OptionGrid from "./OptionGrid";
import { backdropList } from "@/lib/kanvasly/backdrops";
import { lightingPresetList } from "@/lib/kanvasly/relighting";
import { studioExportList, exportPresets } from "@/lib/kanvasly/exportUtils";

const PanelHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={15} className="text-kanvasly-primary" />
    <h3 className="text-[13px] font-semibold text-kanvasly-primary-text">{title}</h3>
  </div>
);

export default function BatchControls({ state, setters, actions, items, processing, progress }) {
  const prog = progress ? `${progress.current}/${progress.total}` : `${items.length}`;
  return (
    <div className="kv-panel">
      <div className="kv-control-group">
        <PanelHeader icon={Images} title="Batch" />
        <div className="flex gap-2">
          <button className="kv-btn-secondary kv-btn-full" onClick={actions.addImages}>
            Add images
          </button>
          <button className="kv-btn-secondary kv-btn-full" onClick={actions.addFolder}>
            Add folder
          </button>
        </div>
        <button
          className="kv-btn-secondary kv-btn-full"
          onClick={actions.clearBatch}
          disabled={!items.length}
        >
          Clear all ({items.length})
        </button>
      </div>

      <div className="kv-control-group mt-5">
        <PanelHeader icon={Layers} title="Backdrop" />
        <OptionGrid options={backdropList} value={state.backdrop} onSelect={actions.selectBackdrop} />
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-kanvasly-secondary">Custom color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.customColor}
              onChange={(e) => actions.selectCustomColor(e.target.value)}
              className="kv-color-input"
            />
            <span className="text-[12px] text-kanvasly-tertiary tabular-nums">
              {state.customColor.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="kv-control-group mt-5">
        <PanelHeader icon={Sparkles} title="Position & shadow" />
        <Slider label="Position X" value={state.product.x} min={0} max={100} step={1} unit="%" onChange={(v) => setters.setProduct({ x: v })} />
        <Slider label="Position Y" value={state.product.y} min={0} max={100} step={1} unit="%" onChange={(v) => setters.setProduct({ y: v })} />
        <Slider label="Product scale" value={state.product.scale} min={20} max={200} step={1} unit="%" onChange={(v) => setters.setProduct({ scale: v })} />
        <Slider label="Shadow opacity" value={state.shadow.opacity} min={0} max={100} unit="%" onChange={(v) => setters.setShadow({ opacity: v })} />
        <Slider label="Shadow blur" value={state.shadow.blur} min={0} max={60} unit="px" onChange={(v) => setters.setShadow({ blur: v })} />
        <Slider label="Shadow offset X" value={state.shadow.offsetX} min={-50} max={50} unit="px" onChange={(v) => setters.setShadow({ offsetX: v })} />
        <Slider label="Shadow offset Y" value={state.shadow.offsetY} min={0} max={80} unit="px" onChange={(v) => setters.setShadow({ offsetY: v })} />
        <label className="kv-checkbox">
          <input
            type="checkbox"
            checked={state.reflection.enabled}
            onChange={(e) => setters.setReflection({ enabled: e.target.checked })}
          />
          Add reflection
        </label>
        <div className={cn("flex flex-col gap-3", !state.reflection.enabled && "kv-disabled")}>
          <Slider label="Reflection opacity" value={state.reflection.opacity} min={0} max={100} unit="%" onChange={(v) => setters.setReflection({ opacity: v })} />
          <Slider label="Reflection scale" value={state.reflection.scale} min={20} max={100} unit="%" onChange={(v) => setters.setReflection({ scale: v })} />
          <Slider label="Reflection blur" value={state.reflection.blur} min={0} max={20} unit="px" onChange={(v) => setters.setReflection({ blur: v })} />
        </div>
      </div>

      <div className="kv-control-group mt-5">
        <PanelHeader icon={Sun} title="Lighting" />
        <OptionGrid options={lightingPresetList} value={state.relight.preset} onSelect={actions.selectLighting} />
        <Slider label="Brightness" value={state.relight.brightness} min={50} max={150} unit="%" onChange={(v) => setters.setRelight({ brightness: v })} />
        <Slider label="Contrast" value={state.relight.contrast} min={50} max={150} unit="%" onChange={(v) => setters.setRelight({ contrast: v })} />
        <Slider label="Saturation" value={state.relight.saturation} min={0} max={200} unit="%" onChange={(v) => setters.setRelight({ saturation: v })} />
        <Slider label="Temperature" value={state.relight.temperature} min={-50} max={50} unit="" onChange={(v) => setters.setRelight({ temperature: v })} />
        <Slider label="Vignette" value={state.relight.vignette} min={0} max={100} unit="%" onChange={(v) => setters.setRelight({ vignette: v })} />
      </div>

      <div className="kv-control-group mt-5">
        <PanelHeader icon={Download} title="Export" />
        <div className="flex flex-col gap-1.5">
          {studioExportList.map((key) => (
            <button
              key={key}
              type="button"
              className={cn("kv-preset", state.exportPreset === key && "kv-preset-active")}
              onClick={() => actions.selectExportPreset(key)}
            >
              <span>{key === "custom" ? "Custom size" : exportPresets[key].label}</span>
              <span className="kv-preset-size">
                {key === "custom" ? `${state.customW}×${state.customH}` : exportPresets[key].size}
              </span>
            </button>
          ))}
        </div>
        {state.exportPreset === "custom" && (
          <div className="flex gap-2">
            <input
              type="number"
              className="kv-input"
              value={state.customW}
              onChange={(e) => setters.setCustomW(Number(e.target.value) || 0)}
              placeholder="Width"
            />
            <input
              type="number"
              className="kv-input"
              value={state.customH}
              onChange={(e) => setters.setCustomH(Number(e.target.value) || 0)}
              placeholder="Height"
            />
          </div>
        )}
        <select
          className="kv-select"
          value={state.exportFormat}
          onChange={(e) => setters.setExportFormat(e.target.value)}
        >
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
        </select>
        <button
          className="kv-btn-primary kv-btn-full"
          onClick={actions.processBatch}
          disabled={!items.length || processing}
        >
          {processing ? `Processing ${prog}…` : `Process & export all (${items.length})`}
        </button>
      </div>
    </div>
  );
}