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
import { generateBackdrop, generateColorBackdrop } from "@/lib/kanvasly/backdrops";
import { generateCatalog, compositeAngle, angleTransforms } from "@/lib/kanvasly/catalog";
import { compositeOnModel } from "@/lib/kanvasly/onModel";
import { exportToPreset } from "@/lib/kanvasly/exportUtils";
import { lightingPresets } from "@/lib/kanvasly/relighting";
import { renderStudio, renderRetouch, ensureBackdrop } from "@/lib/kanvasly/render";

const INITIAL = {
  mode: "studio",
  backdrop: "studio-white",
  shadow: { opacity: 50, blur: 20, offsetX: 0, offsetY: 15 },
  reflection: { enabled: false, opacity: 30, scale: 100, blur: 2 },
  product: { x: 50, y: 50, scale: 100 },
  onModel: { pose: "standing", scale: 100, x: 50, y: 50 },
  catalogAngle: { rotation: 0, scaleY: 1 },
  customColor: "#7B6FE0",
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
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const uploadedPhotoCanvasRef = useRef(null);
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
  const setCatalogAngle = (v) => patch({ catalogAngle: v });
  const setProduct = (p) => setS((prev) => ({ ...prev, product: { ...prev.product, ...p } }));
  const setCustomColor = (v) => patch({ customColor: v });
  const catalogAngleRef = useRef({ rotation: 0, scaleY: 1 });
  useEffect(() => { catalogAngleRef.current = s.catalogAngle; }, [s.catalogAngle]);

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
    let raf = requestAnimationFrame(() => {
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
        } else if (currentStep === "catalog" && productImage) {
          const bd = backdropImage || generateBackdrop(s.backdrop, canvas.width, canvas.height);
          const out = compositeAngle(productImage, bd, s.catalogAngle);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(out, 0, 0);
        } else {
          renderStudio(ctx, canvas, state);
        }
      } else {
        renderRetouch(ctx, canvas, state);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [s, originalImage, productImage, backdropImage, hasImage, mode, currentStep, canvasSize]);

  useEffect(() => {
    if (mode !== "studio" || currentStep !== "catalog" || !productImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pointers = new Map();
    let singleDrag = false;
    let startX = 0;
    let startY = 0;
    let start = { rotation: 0, scaleY: 1 };
    let lastGestureAngle = 0;
    let gestureBase = 0;
    let gestureAccum = 0;

    const onDown = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      if (pointers.size === 1) {
        singleDrag = true;
        startX = e.clientX;
        startY = e.clientY;
        start = { ...catalogAngleRef.current };
        canvas.style.cursor = "grabbing";
      } else if (pointers.size === 2) {
        singleDrag = false;
        const [p1, p2] = [...pointers.values()];
        lastGestureAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        gestureBase = catalogAngleRef.current.rotation;
        gestureAccum = 0;
      }
    };
    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const fine = e.shiftKey ? 0.25 : 1;
      if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        let delta = ang - lastGestureAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        gestureAccum += delta;
        lastGestureAngle = ang;
        const rotation = Math.max(-180, Math.min(180, gestureBase + gestureAccum * (180 / Math.PI) * fine));
        setCatalogAngle({ rotation, scaleY: catalogAngleRef.current.scaleY });
      } else if (singleDrag) {
        const rect = canvas.getBoundingClientRect();
        const dx = (e.clientX - startX) / rect.width;
        const dy = (e.clientY - startY) / rect.height;
        const rotation = Math.max(-180, Math.min(180, start.rotation + dx * 80 * fine));
        const scaleY = Math.max(0.5, Math.min(1.1, start.scaleY - dy * 0.6));
        setCatalogAngle({ rotation, scaleY });
      }
    };
    const onUp = (e) => {
      pointers.delete(e.pointerId);
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      if (pointers.size === 1) {
        const [p] = [...pointers.values()];
        singleDrag = true;
        startX = p.x;
        startY = p.y;
        start = { ...catalogAngleRef.current };
      } else if (pointers.size === 0) {
        singleDrag = false;
        canvas.style.cursor = "grab";
      }
    };
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      canvas.style.cursor = "";
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [mode, currentStep, productImage]);

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
    if (!canvasSize.w) return;
    if (key === "custom-color") {
      setBackdropImage(generateColorBackdrop(s.customColor, canvasSize.w, canvasSize.h));
    } else if (key !== "photo") {
      setBackdropImage(generateBackdrop(key, canvasSize.w, canvasSize.h));
    }
  };

  const selectCustomColor = (color) => {
    patch({ customColor: color, backdrop: "custom-color" });
    if (canvasSize.w) setBackdropImage(generateColorBackdrop(color, canvasSize.w, canvasSize.h));
  };

  const selectPhotoFile = async (file) => {
    if (!file.type.startsWith("image/")) {
      notify("Please choose an image file", "error");
      return;
    }
    if (!canvasSize.w) return;
    setProcessing(true);
    setProcessingText("Loading photo...");
    try {
      const img = await loadImageFromFile(file);
      const { canvas, ctx } = createCanvas(canvasSize.w, canvasSize.h);
      const scale = Math.max(canvasSize.w / img.width, canvasSize.h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (canvasSize.w - dw) / 2, (canvasSize.h - dh) / 2, dw, dh);
      uploadedPhotoCanvasRef.current = canvas;
      setUploadedPhoto(URL.createObjectURL(file));
      setBackdropImage(canvas);
      patch({ backdrop: "photo" });
      notify("Backdrop photo applied");
    } catch (err) {
      notify("Could not load photo: " + err.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const reapplyPhoto = () => {
    if (uploadedPhotoCanvasRef.current) {
      setBackdropImage(uploadedPhotoCanvasRef.current);
      patch({ backdrop: "photo" });
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
        notify("Catalog generated");
      } catch (err) {
        notify("Catalog generation failed: " + err.message, "error");
      } finally {
        setProcessing(false);
      }
    }, 80);
  };

  const onCatalogThumb = (a) => {
    const key = a.key || a.angle;
    const t = angleTransforms[key];
    setCatalogAngle(t ? { rotation: t.rotation || 0, scaleY: t.scaleY || 1 } : { rotation: 0, scaleY: 1 });
  };

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
    if (m === "studio") setCurrentStep("upload");
    else setCurrentTool("bg-remove");
  };

  // ---- sidebar nav ----
  const onSidebarSelect = (key) => {
    if (mode === "studio") {
      setCurrentStep(key);
    } else {
      setCurrentTool(key);
    }
  };

  // ---- topbar export click ----
  const onExportClick = () => {
    if (mode === "studio") setCurrentStep("export");
    else setCurrentTool("export");
  };

  const STEP_ORDER = ["upload", "remove-bg", "backdrop", "effects", "catalog", "on-model", "export"];

  const nextStep = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx >= 0 && idx < STEP_ORDER.length - 1) setCurrentStep(STEP_ORDER[idx + 1]);
  };

  // Discard the current step's adjustments, then advance.
  const resetStepState = (step) => {
    if (step === "backdrop") {
      patch({ backdrop: "studio-white", customColor: "#7B6FE0" });
      setUploadedPhoto(null);
      uploadedPhotoCanvasRef.current = null;
      if (canvasSize.w) setBackdropImage(generateBackdrop("studio-white", canvasSize.w, canvasSize.h));
    } else if (step === "effects") {
      setS((prev) => ({
        ...prev,
        shadow: { ...INITIAL.shadow },
        reflection: { ...INITIAL.reflection },
        product: { ...INITIAL.product },
      }));
    } else if (step === "catalog") {
      setCatalogAngle({ rotation: 0, scaleY: 1 });
    } else if (step === "on-model") {
      setS((prev) => ({ ...prev, onModel: { ...INITIAL.onModel } }));
    }
  };

  const skipStep = () => {
    resetStepState(currentStep);
    nextStep();
  };

  const actions = {
    studio: {
      browse: () => fileInputRef.current?.click(),
      removeBg: () => doRemoveBg(false),
      selectBackdrop,
      selectCustomColor,
      selectPhotoFile,
      reapplyPhoto,
      generateCatalog: generateCatalogImgs,
      applyOnModel,
      nextStep,
      skipStep,
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
    setProduct,
    setBokeh,
    setRelight,
    setRetouch,
    setCustomColor,
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
              uploadedPhoto={uploadedPhoto}
            />
          ) : (
            <RetouchControls tool={currentTool} state={s} actions={actions.retouch} setters={setters} />
          )}
        </aside>
      </div>
    </div>
  );
}