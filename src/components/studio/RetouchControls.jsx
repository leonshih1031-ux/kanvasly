import React from "react";
import { Wand2, Aperture, SunMedium, Smile, Download } from "lucide-react";
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
      {/* BG REMOVE */}
      {tool === "bg-remove" && (
        <div className="kv-control-group">
          <PanelHeader icon={Wand2} title="Background removal" />
          <Hint>
            Remove distracting backgrounds from any photo. Perfect for cleaning up busy
            product shots.
          </Hint>
          <button className="kv-btn-primary kv-btn-full" onClick={actions.removeBg}>
            Remove background
          </button>
          <Slider
            label="Feather edge"
            value={state.feather}
            min={0}
            max={10}
            unit="px"
            onChange={(v) => setters.setFeather(v)}
          />
        </div>
      )}

      {/* BOKEH */}
      {tool === "bokeh" && (
        <div className="kv-control-group">
          <PanelHeader icon={Aperture} title="DSLR bokeh" />
          <Hint>
            Simulate shallow depth-of-field. The focus area stays sharp while the background
            blurs naturally.
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
          <button className="kv-btn-primary kv-btn-full" onClick={actions.applyBokeh}>
            Apply bokeh
          </button>
        </div>
      )}

      {/* RELIGHT */}
      {tool === "relight" && (
        <div className="kv-control-group">
          <PanelHeader icon={SunMedium} title="Weather & lighting" />
          <Hint>
            Swap lighting conditions and weather. Adjust color temperature, brightness, and
            vignette.
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
            label="Vignette"
            value={state.relight.vignette}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setRelight({ vignette: v, preset: "custom" })}
          />
          <button className="kv-btn-secondary kv-btn-full" onClick={actions.resetLighting}>
            Reset to neutral
          </button>
        </div>
      )}

      {/* RETOUCH */}
      {tool === "retouch" && (
        <div className="kv-control-group">
          <PanelHeader icon={Smile} title="Portrait retouch" />
          <Hint>
            Smooth skin, whiten teeth, and remove blemishes while preserving natural skin
            texture and hair detail.
          </Hint>
          <Slider
            label="Skin smoothing"
            value={state.retouch.smoothing}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setRetouch({ smoothing: v })}
          />
          <label className="kv-checkbox">
            <input
              type="checkbox"
              checked={state.retouch.teethWhitening}
              onChange={(e) => setters.setRetouch({ teethWhitening: e.target.checked })}
            />
            Teeth whitening
          </label>
          <label className="kv-checkbox">
            <input
              type="checkbox"
              checked={state.retouch.blemishRemoval}
              onChange={(e) => setters.setRetouch({ blemishRemoval: e.target.checked })}
            />
            Blemish removal
          </label>
          <button className="kv-btn-primary kv-btn-full" onClick={actions.applyRetouch}>
            Apply retouch
          </button>
        </div>
      )}

      {/* EXPORT */}
      {tool === "export" && (
        <div className="kv-control-group">
          <PanelHeader icon={Download} title="Export" />
          <Hint>Export your enhanced photo.</Hint>
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
          <button className="kv-btn-primary kv-btn-full" onClick={actions.export}>
            Download image
          </button>
        </div>
      )}
    </div>
  );
}