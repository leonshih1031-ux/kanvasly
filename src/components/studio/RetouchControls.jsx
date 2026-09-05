import React, { useEffect, useState } from "react";
import { Aperture, Sparkles, Download, Sliders, Wand2 } from "lucide-react";
import Slider from "./Slider";
import OptionGrid from "./OptionGrid";
import { lightingPresetList } from "@/lib/kanvasly/relighting";
import { cameraFilterList, generateFilterThumbnails } from "@/lib/kanvasly/filters";
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

export default function RetouchControls({ tool, state, actions, setters, originalImage }) {
  const [thumbs, setThumbs] = useState({});
  const [thumbsReady, setThumbsReady] = useState(false);

  // Regenerate filter thumbnails when the source image changes.
  useEffect(() => {
    setThumbs({});
    setThumbsReady(false);
  }, [originalImage]);

  useEffect(() => {
    if (tool === "filters" && originalImage && !thumbsReady) {
      setThumbs(generateFilterThumbnails(originalImage));
      setThumbsReady(true);
    }
  }, [tool, originalImage, thumbsReady]);

  // Helper: mark manual adjustment as custom (clears active filter/preset).
  const adj = (patch) => setters.setRelight({ ...patch, preset: "custom", filter: "custom" });

  return (
    <div className="kv-panel">
      {/* FILTERS */}
      {tool === "filters" && (
        <div className="kv-control-group">
          <PanelHeader icon={Wand2} title="Filters" />
          <Hint>
            One-tap cinematic looks inspired by the iPhone camera. Tap a filter to apply
            it, then fine-tune the result in Adjust.
          </Hint>
          {!originalImage ? (
            <Hint>Upload a photo to preview filters.</Hint>
          ) : !thumbsReady ? (
            <div className="text-[12px] text-kanvasly-tertiary">Generating previews…</div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {cameraFilterList.map((f) => (
                <button
                  key={f.key}
                  onClick={() => actions.selectFilter(f.key)}
                  className={cn(
                    "flex flex-col gap-1 p-1 rounded-lg border transition-all",
                    state.relight.filter === f.key
                      ? "border-kanvasly-primary bg-kanvasly-primary/10"
                      : "border-white/10 hover:border-white/25"
                  )}
                >
                  <img
                    src={thumbs[f.key]}
                    alt={f.label}
                    className="w-full aspect-square object-cover rounded-md"
                  />
                  <span className="text-[10px] text-kanvasly-secondary text-center leading-tight">
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADJUST */}
      {tool === "adjust" && (
        <div className="kv-control-group">
          <PanelHeader icon={Sliders} title="Adjust" />
          <Hint>
            Pro-grade adjustments. Lighting presets set a starting point — your manual
            tweaks layer on top.
          </Hint>
          <OptionGrid
            options={lightingPresetList}
            value={state.relight.preset}
            onSelect={actions.selectLighting}
          />
          <div className="h-px bg-white/5 my-1" />
          <Slider label="Exposure" value={state.relight.exposure} min={-100} max={100} onChange={(v) => adj({ exposure: v })} />
          <Slider label="Highlights" value={state.relight.highlights} min={-100} max={100} onChange={(v) => adj({ highlights: v })} />
          <Slider label="Shadows" value={state.relight.shadows} min={-100} max={100} onChange={(v) => adj({ shadows: v })} />
          <Slider label="Whites" value={state.relight.whites} min={-100} max={100} onChange={(v) => adj({ whites: v })} />
          <Slider label="Blacks" value={state.relight.blacks} min={-100} max={100} onChange={(v) => adj({ blacks: v })} />
          <Slider label="Brightness" value={state.relight.brightness} min={50} max={200} unit="%" onChange={(v) => adj({ brightness: v })} />
          <Slider label="Contrast" value={state.relight.contrast} min={50} max={200} unit="%" onChange={(v) => adj({ contrast: v })} />
          <Slider label="Saturation" value={state.relight.saturation} min={0} max={200} unit="%" onChange={(v) => adj({ saturation: v })} />
          <Slider label="Vibrance" value={state.relight.vibrance} min={-100} max={100} onChange={(v) => adj({ vibrance: v })} />
          <Slider label="Clarity" value={state.relight.clarity} min={-100} max={100} onChange={(v) => adj({ clarity: v })} />
          <Slider label="Temperature" value={state.relight.temperature} min={-50} max={50} onChange={(v) => adj({ temperature: v })} />
          <Slider label="Tint" value={state.relight.tint} min={-50} max={50} onChange={(v) => adj({ tint: v })} />
          <Slider label="Fade" value={state.relight.fade} min={0} max={100} unit="%" onChange={(v) => adj({ fade: v })} />
          <Slider label="Grain" value={state.relight.grain} min={0} max={100} unit="%" onChange={(v) => adj({ grain: v })} />
          <Slider label="Vignette" value={state.relight.vignette} min={0} max={100} unit="%" onChange={(v) => adj({ vignette: v })} />
          <Slider label="Vignette softness" value={state.relight.vignetteShape} min={0} max={100} unit="%" onChange={(v) => adj({ vignetteShape: v })} />
          <button className="kv-btn-secondary kv-btn-full" onClick={actions.resetLighting}>
            Reset to neutral
          </button>
        </div>
      )}

      {/* BOKEH */}
      {tool === "bokeh" && (
        <div className="kv-control-group">
          <PanelHeader icon={Aperture} title="Depth of field" />
          <Hint>
            Simulate shallow depth-of-field. Drag the focus point sliders to move the
            sharp area — the rest blurs naturally.
          </Hint>
          <Slider label="Blur strength" value={state.bokeh.blur} min={1} max={50} unit="px" onChange={(v) => setters.setBokeh({ blur: v })} />
          <Slider label="Focus area" value={state.bokeh.focusScale} min={10} max={100} unit="%" onChange={(v) => setters.setBokeh({ focusScale: v })} />
          <Slider label="Focus point X" value={state.bokeh.focusX} min={0} max={100} unit="%" onChange={(v) => setters.setBokeh({ focusX: v })} />
          <Slider label="Focus point Y" value={state.bokeh.focusY} min={0} max={100} unit="%" onChange={(v) => setters.setBokeh({ focusY: v })} />
          <button className="kv-btn-primary kv-btn-full" onClick={actions.applyBokeh}>
            Apply bokeh
          </button>
        </div>
      )}

      {/* RETOUCH */}
      {tool === "retouch" && (
        <div className="kv-control-group">
          <PanelHeader icon={Sparkles} title="Retouch" />
          <Hint>
            Clean up product photos: remove dust spots, reduce noise, sharpen details, and
            auto-correct color casts.
          </Hint>
          <label className="kv-checkbox">
            <input type="checkbox" checked={state.retouch.dustRemoval} onChange={(e) => setters.setRetouch({ dustRemoval: e.target.checked })} />
            Dust removal
          </label>
          <label className="kv-checkbox">
            <input type="checkbox" checked={state.retouch.colorCorrect} onChange={(e) => setters.setRetouch({ colorCorrect: e.target.checked })} />
            Auto color correction
          </label>
          <Slider label="Denoise" value={state.retouch.denoise} min={0} max={100} unit="%" onChange={(v) => setters.setRetouch({ denoise: v })} />
          <Slider label="Sharpen" value={state.retouch.sharpen} min={0} max={100} unit="%" onChange={(v) => setters.setRetouch({ sharpen: v })} />
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
                  className={cn("kv-preset", state.exportPreset === key && "kv-preset-active")}
                >
                  <span>{preset ? preset.label : "Custom size"}</span>
                  <span className="kv-preset-size">{preset ? preset.size : "—"}</span>
                </button>
              );
            })}
          </div>
          {state.exportPreset === "custom" && (
            <div className="flex gap-2">
              <input type="number" className="kv-input" placeholder="Width" value={state.customW} onChange={(e) => setters.setCustomW(Number(e.target.value))} />
              <input type="number" className="kv-input" placeholder="Height" value={state.customH} onChange={(e) => setters.setCustomH(Number(e.target.value))} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-kanvasly-secondary">Format</label>
            <select className="kv-select" value={state.exportFormat} onChange={(e) => setters.setExportFormat(e.target.value)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          {state.exportFormat === "image/jpeg" && (
            <Slider label="JPEG quality" value={state.exportQuality} min={50} max={100} unit="%" onChange={(v) => setters.setExportQuality(v)} />
          )}
          <button className="kv-btn-primary kv-btn-full" onClick={actions.export}>
            Download image
          </button>
        </div>
      )}
    </div>
  );
}