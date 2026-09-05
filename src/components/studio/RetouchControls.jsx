import React from "react";
import { Aperture, SunMedium, Sparkles, Download } from "lucide-react";
import Slider from "./Slider";
import OptionGrid from "./OptionGrid";
import { lightingPresetList } from "@/lib/kanvasly/relighting";
import { retouchExportList, exportPresets } from "@/lib/kanvasly/exportUtils";
import { cn } from "@/lib/utils";

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

export default function RetouchControls({ tool, state, actions, setters }) {
  return (
    <div className="kv-panel">
      {/* BOKEH */}
      {tool === "bokeh" && (
        <div className="kv-control-group">
          <PanelHeader icon={Aperture} title="Depth of field" />
          <Hint>
            Simulate shallow depth-of-field. Drag the focus point sliders to move the
            sharp area — the rest blurs naturally.
          </Hint>
          <Slider
            label="Blur strength"
            value={state.bokeh.blur}
            min={1}
            max={50}
            unit="px"
            onChange={(v) => setters.setBokeh({ blur: v })}
          />
          <Slider
            label="Focus area"
            value={state.bokeh.focusScale}
            min={10}
            max={100}
            unit="%"
            onChange={(v) => setters.setBokeh({ focusScale: v })}
          />
          <Slider
            label="Focus point X"
            value={state.bokeh.focusX}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setBokeh({ focusX: v })}
          />
          <Slider
            label="Focus point Y"
            value={state.bokeh.focusY}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setBokeh({ focusY: v })}
          />
          <button className="kv-btn-primary kv-btn-full" onClick={actions.applyBokeh}>
            Apply bokeh
          </button>
        </div>
      )}

      {/* RELIGHT */}
      {tool === "relight" && (
        <div className="kv-control-group">
          <PanelHeader icon={SunMedium} title="Color & lighting" />
          <Hint>
            Adjust color grading and lighting. Presets set a starting point — your manual
            adjustments are preserved.
          </Hint>
          <OptionGrid
            options={lightingPresetList}
            value={state.relight.preset}
            onSelect={actions.selectLighting}
          />
          <Slider
            label="Brightness"
            value={state.relight.brightness}
            min={50}
            max={200}
            unit="%"
            onChange={(v) => setters.setRelight({ brightness: v, preset: "custom" })}
          />
          <Slider
            label="Contrast"
            value={state.relight.contrast}
            min={50}
            max={200}
            unit="%"
            onChange={(v) => setters.setRelight({ contrast: v, preset: "custom" })}
          />
          <Slider
            label="Saturation"
            value={state.relight.saturation}
            min={0}
            max={200}
            unit="%"
            onChange={(v) => setters.setRelight({ saturation: v, preset: "custom" })}
          />
          <Slider
            label="Temperature"
            value={state.relight.temperature}
            min={-50}
            max={50}
            onChange={(v) => setters.setRelight({ temperature: v, preset: "custom" })}
          />
          <Slider
            label="Tint"
            value={state.relight.tint}
            min={-50}
            max={50}
            onChange={(v) => setters.setRelight({ tint: v, preset: "custom" })}
          />
          <Slider
            label="Vignette"
            value={state.relight.vignette}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setRelight({ vignette: v, preset: "custom" })}
          />
          <Slider
            label="Vignette softness"
            value={state.relight.vignetteShape}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setRelight({ vignetteShape: v, preset: "custom" })}
          />
          <button className="kv-btn-secondary kv-btn-full" onClick={actions.resetLighting}>
            Reset to neutral
          </button>
        </div>
      )}

      {/* PRODUCT RETOUCH */}
      {tool === "retouch" && (
        <div className="kv-control-group">
          <PanelHeader icon={Sparkles} title="Product retouch" />
          <Hint>
            Clean up product photos: remove dust spots, reduce noise, sharpen details, and
            auto-correct color casts.
          </Hint>
          <label className="kv-checkbox">
            <input
              type="checkbox"
              checked={state.retouch.dustRemoval}
              onChange={(e) => setters.setRetouch({ dustRemoval: e.target.checked })}
            />
            Dust removal
          </label>
          <label className="kv-checkbox">
            <input
              type="checkbox"
              checked={state.retouch.colorCorrect}
              onChange={(e) => setters.setRetouch({ colorCorrect: e.target.checked })}
            />
            Auto color correction
          </label>
          <Slider
            label="Denoise"
            value={state.retouch.denoise}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setRetouch({ denoise: v })}
          />
          <Slider
            label="Sharpen"
            value={state.retouch.sharpen}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setRetouch({ sharpen: v })}
          />
          <button className="kv-btn-primary kv-btn-full" onClick={actions.applyRetouch}>
            Apply retouch
          </button>
        </div>
      )}

      {/* EXPORT */}
      {tool === "export" && (
        <div className="kv-control-group">
          <PanelHeader icon={Download} title="Export" />
          <Hint>Export your enhanced photo. Crop-to-fill ensures no letterboxing.</Hint>
          <div className="flex flex-col gap-1.5">
            {retouchExportList.map((key) => {
              const preset = exportPresets[key];
              return (
                <button
                  key={key}
                  onClick={() => actions.selectExportPreset(key)}
                  className={cn(
                    "kv-preset",
                    state.exportPreset === key && "kv-preset-active"
                  )}
                >
                  <span>{preset ? preset.label : "Custom size"}</span>
                  <span className="kv-preset-size">{preset ? preset.size : "—"}</span>
                </button>
              );
            })}
          </div>
          {state.exportPreset === "custom" && (
            <div className="flex gap-2">
              <input
                type="number"
                className="kv-input"
                placeholder="Width"
                value={state.customW}
                onChange={(e) => setters.setCustomW(Number(e.target.value))}
              />
              <input
                type="number"
                className="kv-input"
                placeholder="Height"
                value={state.customH}
                onChange={(e) => setters.setCustomH(Number(e.target.value))}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-kanvasly-secondary">Format</label>
            <select
              className="kv-select"
              value={state.exportFormat}
              onChange={(e) => setters.setExportFormat(e.target.value)}
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          {state.exportFormat === "image/jpeg" && (
            <Slider
              label="JPEG quality"
              value={state.exportQuality}
              min={50}
              max={100}
              unit="%"
              onChange={(v) => setters.setExportQuality(v)}
            />
          )}
          <button className="kv-btn-primary kv-btn-full" onClick={actions.export}>
            Download image
          </button>
        </div>
      )}
    </div>
  );
}