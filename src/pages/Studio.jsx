import React, { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import Topbar from "@/components/studio/Topbar";
import Sidebar from "@/components/studio/Sidebar";
import CanvasArea from "@/components/studio/CanvasArea";
import StudioControls from "@/components/studio/StudioControls";
import RetouchControls from "@/components/studio/RetouchControls";
import {
  loadImageFromFile,
  loadImageFromBlob,
  createCanvas,
} from "@/lib/kanvasly/utils";
import { removeBackground, featherAlpha, loadBgRemovalLibrary } from "@/lib/kanvasly/bgRemoval";
import { generateBackdrop } from "@/lib/kanvasly/backdrops";
import { generateCatalog } from "@/lib/kanvasly/catalog";
import { compositeOnModel } from "@/lib/kanvasly/onModel";
import { exportToPreset } from "@/lib/kanvasly/exportUtils";
import { lightingPresets } from "@/lib/kanvasly/relighting";
import { renderStudio, renderRetouch, ensureBackdrop } from "@/lib/kanvasly/render";

const INITIAL = {
  mode: "studio",
  backdrop: "studio-white",
  shadow: { opacity: 50, blur: 20, offsetY: 15 },
  reflection: { enabled: false, opacity: 30, scale: 100 },
  onModel: { pose: "standing", scale: 100, x: 50, y: 50 },
  bgModel: "isnet_fp16",
  bokeh: { blur: 15, focusScale: 60, applied: false },
  relight: { preset: "neutral", brightness: 100, contrast: 100, saturation: 100, temperature: 0, vignette: 0 },
  retouch: { smoothing: 50, teethWhitening: false, blemishRemoval: false, applied: false },
  feather: 2,
  exportPreset: "shopify-main",
  exportFormat: "image/png",
  customW: 1080,
  customH: 1080,
};

export default function Studio() {
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [s, setS] = useState({ ...INITIAL });
  const [originalImage, setOriginalImage] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [backdropImage, setBackdropImage] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [currentStep, setCurrentStep] = useState("upload");
  const [currentTool, setCurrentTool] = useState("bg-remove");
  const [catalogAngles, setCatalogAngles] = useState([]);
  const [catalogView, setCatalogView] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("Processing...");
  const [progress, setProgress] = useState(null);

  const hasImage = !!originalImage;
  const mode = s.mode;

  // ---- state setters ----
  const patch = useCallback((p) => setS((prev) => ({ ...prev, ...p })), []);
  const setShadow = (p) => setS((prev) => ({ ...prev, shadow: { ...prev.shadow, ...p } }));
  const setReflection = (p) => setS((prev) => ({ ...prev, reflection: { ...prev.reflection, ...p } }));
  const setOnModel = (p) => setS((prev) => ({ ...prev, onModel: { ...prev.onModel, ...p } }));
  const setBokeh = (p) => setS((prev) => ({ ...prev, bokeh: { ...prev.bokeh, ...p } }));
  const setRelight = (p) => setS((prev) => ({ ...prev, relight: { ...prev.relight, ...p } }));
  const setRetouch = (p) => setS((prev) => ({ ...prev, retouch: { ...prev.retouch, ...p } }));

  // ---- size the canvas element once it mounts / dimensions change ----
  useEffect(() => {
    if (canvasRef.current && canvasSize.w) {
      canvasRef.current.width = canvasSize.w;
      canvasRef.current.height = canvasSize.h;
    }
  }, [canvasSize, hasImage]);

  // ---- render effect (debounced for smooth sliders) ----
  useEffect(() => {
    if (!hasImage) return;
    const t = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const state = { ...s, originalImage, productImage, backdropImage, canvas };

      if (mode === "studio") {
        if (currentStep === "on-model" && productImage) {
          const bd = ensureBackdrop(state) || generateBackdrop(s.backdrop, canvas.width, canvas.height);
          const result = compositeOnModel(productImage, s.onModel.pose, s.onModel.scale, s.onModel.x, s.onModel.y, bd);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(result, 0, 0);
        } else if (catalogView) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = catalogView;
        } else {
          renderStudio(ctx, canvas, state);
        }
      } else {
        renderRetouch(ctx, canvas, state);
      }
    }, 60);
    return () => clearTimeout(t);
  }, [s, originalImage, productImage, backdropImage, hasImage, mode, currentStep, catalogView, canvasSize]);

  const notify = (title, variant) => toast({ title, variant: variant === "error" ? "destructive" : "default" });

  // ---- file loading ----
  const loadFile = async (file) => {
    if (!file.type.startsWith("image/") && !file.type.match(/heic|heif/i) && !file.name.match(/\.(heic|heif)$/i)) {
      notify("Please upload an image file", "error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      notify("Image too large (max 20MB)", "error");
      return;
    }
    try {
      const img = await loadImageFromFile(file);
      setOriginalImage(img);
      setProductImage(null);
      setBackdropImage(null);
      setCatalogAngles([]);
      setCatalogView(null);

      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const maxDim = 2048;
      if (Math.max(w, h) > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      setCanvasSize({ w, h });

      if (mode === "studio") setCurrentStep("remove-bg");
      notify("Image loaded successfully");
    } catch (err) {
      notify("Failed to load image: " + err.message, "error");
    }
  };

  // ---- background removal ----
  const doRemoveBg = async (isRetouch) => {
    if (!originalImage) {
      notify("Upload an image first", "error");
      return;
    }
    if (processing) return;
    setProcessing(true);
    setProgress(null);
    setProcessingText("Loading AI model...");
    try {
      await loadBgRemovalLibrary();
      setProcessingText("Isolating product...");
      const resultBlob = await removeBackground(originalImage, { model: s.bgModel }, (key, current, total) => {
        const pct = Math.round((current / total) * 100);
        setProgress(pct);
        setProcessingText(key.includes("fetch") ? `Downloading AI model... ${pct}%` : `Processing image... ${pct}%`);
      });
      setProcessingText("Finishing...");
      let product = await loadImageFromBlob(resultBlob);

      if (isRetouch && s.feather > 0) {
        const { canvas: fc, ctx: fctx } = createCanvas(product.naturalWidth, product.naturalHeight);
        fctx.drawImage(product, 0, 0);
        featherAlpha(fc, s.feather);
        const featheredBlob = await new Promise((r) => fc.toBlob(r, "image/png"));
        product = await loadImageFromBlob(featheredBlob);
      }

      setProductImage(product);
      if (!isRetouch) {
        const bd = generateBackdrop(s.backdrop, canvasSize.w, canvasSize.h);
        setBackdropImage(bd);
        setCurrentStep("backdrop");
      }
      notify("Background removed successfully");
    } catch (err) {
      notify("Background removal failed: " + (err.message || "Unknown error"), "error");
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  // ---- backdrop selection ----
  const selectBackdrop = (key) => {
    patch({ backdrop: key });
    if (productImage && canvasSize.w) {
      setBackdropImage(generateBackdrop(key, canvasSize.w, canvasSize.h));
    }
  };

  // ---- catalog ----
  const generateCatalogImgs = () => {
    if (!productImage) {
      notify("Remove background first", "error");
      return;
    }
    let bd = backdropImage;
    if (!bd && canvasSize.w) {
      bd = generateBackdrop(s.backdrop, canvasSize.w, canvasSize.h);
      setBackdropImage(bd);
    }
    setProcessing(true);
    setProcessingText("Generating angles...");
    setTimeout(() => {
      try {
        const angles = generateCatalog(productImage, bd);
        setCatalogAngles(angles);
        setCatalogView(angles[0].dataURL);
        notify("Catalog generated");
      } catch (err) {
        notify("Catalog generation failed: " + err.message, "error");
      } finally {
        setProcessing(false);
      }
    }, 80);
  };

  const onCatalogThumb = (a) => setCatalogView(a.dataURL);

  // ---- on-model (live preview via render effect) ----
  const applyOnModel = () => notify("On-model preview applied");

  // ---- bokeh ----
  const applyBokeh = () => {
    if (!originalImage) {
      notify("Upload an image first", "error");
      return;
    }
    setBokeh({ applied: true });
    notify("Bokeh applied");
  };

  // ---- retouch ----
  const applyRetouch = () => {
    if (!originalImage) {
      notify("Upload an image first", "error");
      return;
    }
    setRetouch({ applied: true });
    notify("Retouch applied");
  };

  // ---- lighting ----
  const selectLighting = (key) => {
    const preset = lightingPresets[key];
    if (preset) setS((prev) => ({ ...prev, relight: { preset: key, ...preset } }));
  };
  const resetLighting = () => {
    setS((prev) => ({ ...prev, relight: { preset: "neutral", ...lightingPresets.neutral } }));
    notify("Lighting reset to neutral");
  };

  // ---- export ----
  const selectExportPreset = (key) => patch({ exportPreset: key });
  const doExport = () => {
    if (!canvasRef.current || !originalImage) {
      notify("No image to export", "error");
      return;
    }
    exportToPreset(canvasRef.current, s.exportPreset, s.exportFormat, 0.92, s.customW, s.customH);
    notify("Image exported successfully");
  };

  // ---- mode switch ----
  const onModeChange = (m) => {
    setS((prev) => ({ ...prev, mode: m }));
    setCatalogView(null);
    if (m === "studio") setCurrentStep("upload");
    else setCurrentTool("bg-remove");
  };

  // ---- sidebar nav ----
  const onSidebarSelect = (key) => {
    if (mode === "studio") {
      setCurrentStep(key);
      if (key !== "catalog") setCatalogView(null);
    } else {
      setCurrentTool(key);
    }
  };

  // ---- topbar export click ----
  const onExportClick = () => {
    if (mode === "studio") setCurrentStep("export");
    else setCurrentTool("export");
  };

  const actions = {
    studio: {
      browse: () => fileInputRef.current?.click(),
      removeBg: () => doRemoveBg(false),
      selectBackdrop,
      generateCatalog: generateCatalogImgs,
      applyOnModel,
      export: doExport,
      selectExportPreset,
    },
    retouch: {
      removeBg: () => doRemoveBg(true),
      applyBokeh,
      applyRetouch,
      selectLighting,
      resetLighting,
      export: doExport,
      selectExportPreset,
    },
  };

  const setters = {
    setBgModel: (v) => patch({ bgModel: v }),
    setShadow,
    setReflection,
    setOnModel,
    setBokeh,
    setRelight,
    setRetouch,
    setFeather: (v) => patch({ feather: v }),
    setExportFormat: (v) => patch({ exportFormat: v }),
    setCustomW: (v) => patch({ customW: v }),
    setCustomH: (v) => patch({ customH: v }),
  };

  return (
    <div className="kv-app">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/heif,image/heic,.heic,.heif,.HEIC,.HEIF"
        hidden
        onChange={(e) => e.target.files.length > 0 && loadFile(e.target.files[0])}
      />
      <Topbar mode={mode} onModeChange={onModeChange} hasImage={hasImage} onExportClick={onExportClick} />
      <div className="kv-layout">
        <Sidebar mode={mode} current={mode === "studio" ? currentStep : currentTool} onSelect={onSidebarSelect} />
        <CanvasArea
          hasImage={hasImage}
          onFile={loadFile}
          processing={processing}
          processingText={processingText}
          progress={progress}
          canvasRef={canvasRef}
          originalImage={originalImage}
        />
        <aside className="kv-controls-panel">
          {mode === "studio" ? (
            <StudioControls
              step={currentStep}
              state={s}
              actions={actions.studio}
              setters={setters}
              catalogAngles={catalogAngles}
              onCatalogThumb={onCatalogThumb}
            />
          ) : (
            <RetouchControls tool={currentTool} state={s} actions={actions.retouch} setters={setters} />
          )}
        </aside>
      </div>
    </div>
  );
}