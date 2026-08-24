import React, { useRef } from "react";
import { Sparkles, Wand2, Layers, User, Download, FolderOpen } from "lucide-react";
import Slider from "./Slider";
import OptionGrid from "./OptionGrid";
import { backdropList } from "@/lib/kanvasly/backdrops";
import { angleList } from "@/lib/kanvasly/catalog";
import { modelPoseList } from "@/lib/kanvasly/onModel";
import { studioExportList, exportPresets } from "@/lib/kanvasly/exportUtils";
import { cn } from "@/lib/utils";

const BG_MODELS = [
  { value: "isnet_quint8", label: "Fast (40MB)" },
  { value: "isnet_fp16", label: "Balanced (80MB)" },
  { value: "isnet", label: "Best quality (80MB)" },
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

export default function StudioControls({
  step,
  state,
  actions,
  setters,
  catalogAngles,
  onCatalogThumb,
  uploadedPhoto,
}) {
  const photoInputRef = useRef(null);
  return (
    <div className="kv-panel">
      {/* UPLOAD */}
      {step === "upload" && (
        <div className="kv-control-group">
          <PanelHeader icon={FolderOpen} title="Upload product photo" />
          <Hint>
            Upload a raw smartphone snapshot of any product — perfume bottles, jewelry,
            action figures, guitars, anything. Kanvasly will isolate it and place it into a
            studio-quality backdrop.
          </Hint>
          <button className="kv-btn-secondary kv-btn-full" onClick={actions.browse}>
            Browse files
          </button>
        </div>
      )}

      {/* REMOVE BG */}
      {step === "remove-bg" && (
        <div className="kv-control-group">
          <PanelHeader icon={Wand2} title="Background removal" />
          <Hint>
            Our AI isolates your product with pixel-perfect edge detection. Handles
            transparent glass, shiny metal, and intricate details.
          </Hint>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-kanvasly-secondary">Model quality</label>
            <select
              className="kv-select"
              value={state.bgModel}
              onChange={(e) => setters.setBgModel(e.target.value)}
            >
              {BG_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <button className="kv-btn-primary kv-btn-full" onClick={actions.removeBg}>
            Remove background
          </button>
        </div>
      )}

      {/* BACKDROP */}
      {step === "backdrop" && (
        <div className="kv-control-group">
          <PanelHeader icon={Layers} title="Backdrop" />
          <Hint>
            Choose a procedural backdrop, pick an exact color, or use a photo from the
            library.
          </Hint>
          <OptionGrid
            options={backdropList}
            value={state.backdrop}
            onSelect={actions.selectBackdrop}
          />
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-kanvasly-secondary">Your own photo</label>
            <button
              type="button"
              className="kv-btn-secondary kv-btn-full"
              onClick={() => photoInputRef.current?.click()}
            >
              Upload from device
            </button>
            {uploadedPhoto && (
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  title="Use your photo"
                  onClick={() => actions.reapplyPhoto && actions.reapplyPhoto()}
                  className={cn(
                    "kv-photo-thumb",
                    state.backdrop === "photo" && "kv-photo-thumb-active"
                  )}
                  style={{ backgroundImage: `url(${uploadedPhoto})` }}
                />
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) actions.selectPhotoFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}

      {/* EFFECTS */}
      {step === "effects" && (
        <div className="kv-control-group">
          <PanelHeader icon={Sparkles} title="Position & lighting" />
          <Slider
            label="Position X"
            value={state.product.x}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => setters.setProduct({ x: v })}
          />
          <Slider
            label="Position Y"
            value={state.product.y}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => setters.setProduct({ y: v })}
          />
          <Slider
            label="Product scale"
            value={state.product.scale}
            min={20}
            max={200}
            step={1}
            unit="%"
            onChange={(v) => setters.setProduct({ scale: v })}
          />
          <div className="h-px bg-white/5 my-1" />
          <Slider
            label="Shadow opacity"
            value={state.shadow.opacity}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setShadow({ opacity: v })}
          />
          <Slider
            label="Shadow blur"
            value={state.shadow.blur}
            min={0}
            max={60}
            unit="px"
            onChange={(v) => setters.setShadow({ blur: v })}
          />
          <Slider
            label="Shadow offset X"
            value={state.shadow.offsetX}
            min={-50}
            max={50}
            unit="px"
            onChange={(v) => setters.setShadow({ offsetX: v })}
          />
          <Slider
            label="Shadow offset Y"
            value={state.shadow.offsetY}
            min={0}
            max={80}
            unit="px"
            onChange={(v) => setters.setShadow({ offsetY: v })}
          />
          <label className="kv-checkbox">
            <input
              type="checkbox"
              checked={state.reflection.enabled}
              onChange={(e) => setters.setReflection({ enabled: e.target.checked })}
            />
            Add reflection
          </label>
          <div className={cn("flex flex-col gap-3", !state.reflection.enabled && "kv-disabled")}>
            <Slider
              label="Reflection opacity"
              value={state.reflection.opacity}
              min={0}
              max={100}
              unit="%"
              onChange={(v) => setters.setReflection({ opacity: v })}
            />
            <Slider
              label="Reflection scale"
              value={state.reflection.scale}
              min={20}
              max={100}
              unit="%"
              onChange={(v) => setters.setReflection({ scale: v })}
            />
            <Slider
              label="Reflection blur"
              value={state.reflection.blur}
              min={0}
              max={20}
              unit="px"
              onChange={(v) => setters.setReflection({ blur: v })}
            />
          </div>
        </div>
      )}

      {/* CATALOG */}
      {step === "catalog" && (
        <div className="kv-control-group">
          <PanelHeader icon={Layers} title="Multi-angle catalog" />
          <Hint>
            Drag on the canvas to rotate. Use two fingers to rotate precisely, or
            hold Shift for fine control. Click a preset to snap to an angle.
          </Hint>
          <OptionGrid options={angleList} value="front" onSelect={(k) => onCatalogThumb({ key: k })} />
          <button className="kv-btn-primary kv-btn-full" onClick={actions.generateCatalog}>
            Generate all angles
          </button>
          {catalogAngles.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {catalogAngles.map((a) => (
                <img
                  key={a.angle}
                  src={a.dataURL}
                  alt={a.label}
                  title={a.label}
                  onClick={() => onCatalogThumb(a)}
                  className="kv-thumb"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ON-MODEL */}
      {step === "on-model" && (
        <div className="kv-control-group">
          <PanelHeader icon={User} title="On-model placement" />
          <Hint>
            Preview your product on a model silhouette. The anatomical matrix positions
            products naturally onto generated model forms.
          </Hint>
          <OptionGrid
            options={modelPoseList}
            value={state.onModel.pose}
            onSelect={(k) => setters.setOnModel({ pose: k })}
          />
          <Slider
            label="Product scale"
            value={state.onModel.scale}
            min={20}
            max={200}
            unit="%"
            onChange={(v) => setters.setOnModel({ scale: v })}
          />
          <Slider
            label="Position X"
            value={state.onModel.x}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setOnModel({ x: v })}
          />
          <Slider
            label="Position Y"
            value={state.onModel.y}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setters.setOnModel({ y: v })}
          />
          <button className="kv-btn-primary kv-btn-full" onClick={actions.applyOnModel}>
            Apply placement
          </button>
        </div>
      )}

      {/* EXPORT */}
      {step === "export" && (
        <div className="kv-control-group">
          <PanelHeader icon={Download} title="Export" />
          <Hint>Export your composited image at platform-specific dimensions.</Hint>
          <div className="flex flex-col gap-1.5">
            {studioExportList.map((key) => {
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

      {step !== "upload" && step !== "export" && (
        <button className="kv-btn-secondary kv-btn-full mt-3" onClick={actions.skipStep}>
          Skip this step
        </button>
      )}
    </div>
  );
}