// Kanvasly Studio — AI product photography workspace
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
import { compositeOnModel, compositeOnAIModel } from "@/lib/kanvasly/onModel";
import { exportToPreset } from "@/lib/kanvasly/exportUtils";
import { lightingPresets, applyRelighting } from "@/lib/kanvasly/relighting";
import { cameraFilters } from "@/lib/kanvasly/filters";
import { compositeProduct } from "@/lib/kanvasly/compositing";
import { renderStudio, renderRetouch, ensureBackdrop } from "@/lib/kanvasly/render";
import BatchSidebar from "@/components/studio/BatchSidebar";
import BatchCanvasArea from "@/components/studio/BatchCanvasArea";
import BatchControls from "@/components/studio/BatchControls";
import PresetModal from "@/components/studio/PresetModal";
import { base44 } from "@/api/base44Client";

const INITIAL = {
  mode: "studio",
  backdrop: "studio-white",
  shadow: { enabled: true, opacity: 50, blur: 20, offsetX: 0, offsetY: 15 },
  reflection: { enabled: false, opacity: 30, scale: 100, blur: 2 },
  product: { x: 50, y: 50, scale: 100 },
  onModel: { pose: "standing", scale: 100, x: 50, y: 50 },
  catalogAngle: { rotation: 0, scaleY: 1 },
  customColor: "#7B6FE0",
  bgModel: "isnet_fp16",
  backdropBlur: 0,
  bokeh: { blur: 15, focusScale: 60, focusX: 50, focusY: 50, applied: false },
  relight: {
    preset: "neutral", filter: "original",
    brightness: 100, contrast: 100, saturation: 100,
    exposure: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
    vibrance: 0, clarity: 0, fade: 0, grain: 0,
    temperature: 0, tint: 0, vignette: 0, vignetteShape: 50,
  },
  retouch: { dustRemoval: false, sharpen: 0, denoise: 0, colorCorrect: false, applied: false },
  feather: 2,
  exportPreset: "shopify-main",
  exportFormat: "image/png",
  exportQuality: 92,
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
  const [currentTool, setCurrentTool] = useState("filters");
  const [catalogAngles, setCatalogAngles] = useState([]);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const uploadedPhotoCanvasRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [batchItems, setBatchItems] = useState([]);
  const [batchPreviewOriginal, setBatchPreviewOriginal] = useState(null);
  const [batchPreviewProduct, setBatchPreviewProduct] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [onModelImage, setOnModelImage] = useState(null);
  const batchImagesInputRef = useRef(null);
  const batchFolderInputRef = useRef(null);
  const [processingText, setProcessingText] = useState("Processing...");
  const [progress, setProgress] = useState(null);
  const [showPresets, setShowPresets] = useState(false);

  // Snapshot of the studio composition settings to save into / load from a preset.
  const presetSettings = {
    shadow: s.shadow,
    reflection: s.reflection,
    product: s.product,
    relight: s.relight,
    backdrop: s.backdrop,
    customColor: s.customColor,
    backdropBlur: s.backdropBlur,
    onModel: s.onModel,
  };

  const applyPreset = (settings) => {
    if (!settings) return;
    setS((prev) => ({
      ...prev,
      ...(settings.shadow ? { shadow: { ...prev.shadow, ...settings.shadow } } : {}),
      ...(settings.reflection ? { reflection: { ...prev.reflection, ...settings.reflection } } : {}),
      ...(settings.product ? { product: { ...prev.product, ...settings.product } } : {}),
      ...(settings.relight ? { relight: { ...prev.relight, ...settings.relight } } : {}),
      ...(settings.backdrop ? { backdrop: settings.backdrop } : {}),
      ...(settings.customColor ? { customColor: settings.customColor } : {}),
      ...(settings.backdropBlur !== undefined ? { backdropBlur: settings.backdropBlur } : {}),
      ...(settings.onModel ? { onModel: { ...prev.onModel, ...settings.onModel } } : {}),
    }));
    if (settings.backdrop && canvasSize.w) {
      if (settings.backdrop === "custom-color" && settings.customColor) {
        setBackdropImage(generateColorBackdrop(settings.customColor, canvasSize.w, canvasSize.h));
      } else if (settings.backdrop !== "photo") {
        setBackdropImage(generateBackdrop(settings.backdrop, canvasSize.w, canvasSize.h));
      }
    }
    toast({ title: "Preset applied" });
  };

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
  const catalogDrawStateRef = useRef({});
  const catalogStateVersionRef = useRef(0);
  const catalogPresetRef = useRef(null);
  // Live angle from the catalog RAF loop — the user's actual intended rotation,
  // updated in real time. Read by nextStep() to persist before navigating.
  const catalogLiveAngleRef = useRef({ rotation: 0, scaleY: 1 });
  useEffect(() => {
    catalogDrawStateRef.current = {
      backdropImage, shadow: s.shadow, reflection: s.reflection,
      product: s.product, backdrop: s.backdrop, backdropBlur: s.backdropBlur,
    };
    catalogStateVersionRef.current++;
  });

  // ---- size the canvas element once it mounts / dimensions change ----
  useEffect(() => {
    if (canvasRef.current && canvasSize.w) {
      canvasRef.current.width = canvasSize.w;
      canvasRef.current.height = canvasSize.h;
    }
  }, [canvasSize, hasImage]);

  // ---- render effect (debounced for smooth sliders) ----
  useEffect(() => {
    if (mode === "batch") {
      let raf = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (canvasSize.w) {
          canvas.width = canvasSize.w;
          canvas.height = canvasSize.h;
        }
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;
        if (!w || !h) return;
        const bd =
          s.backdrop === "custom-color"
            ? generateColorBackdrop(s.customColor, w, h)
            : generateBackdrop(s.backdrop, w, h);
        ctx.clearRect(0, 0, w, h);
        if (batchPreviewProduct) {
          const comp = compositeProduct(batchPreviewProduct, bd, s.shadow, s.reflection, s.product, s.backdropBlur || 0);
          ctx.drawImage(comp, 0, 0);
        } else if (batchPreviewOriginal) {
          ctx.drawImage(batchPreviewOriginal, 0, 0, w, h);
        } else {
          ctx.drawImage(bd, 0, 0);
        }
        applyRelighting(canvas, s.relight);
      });
      return () => cancelAnimationFrame(raf);
    }
    if (!hasImage) return;
    let raf = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const state = { ...s, originalImage, productImage, backdropImage, canvas, catalogAngle: s.catalogAngle };

      if (mode === "studio") {
        if (currentStep === "on-model" && productImage) {
          const bd = ensureBackdrop(state) || generateBackdrop(s.backdrop, canvas.width, canvas.height);
          const result = onModelImage
            ? compositeOnAIModel(productImage, onModelImage, s.onModel.scale, s.onModel.x, s.onModel.y, bd, s.shadow, s.reflection, s.catalogAngle)
            : compositeOnModel(productImage, s.onModel.pose, s.onModel.scale, s.onModel.x, s.onModel.y, bd, s.shadow, s.reflection, s.catalogAngle);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(result, 0, 0);
        } else if (currentStep === "catalog") {
          // Drawing handled by the smooth rotation RAF effect below
        } else {
          renderStudio(ctx, canvas, state);
        }
      } else {
        renderRetouch(ctx, canvas, state);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [s, originalImage, productImage, backdropImage, onModelImage, hasImage, mode, currentStep, canvasSize, batchPreviewOriginal, batchPreviewProduct]);

  useEffect(() => {
    if (mode !== "studio" || currentStep !== "catalog" || !productImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // Target angle (what the user aims at) vs current angle (what's displayed).
    // The RAF loop eases current → target for buttery-smooth, fluid motion.
    const target = { rotation: catalogAngleRef.current.rotation, scaleY: catalogAngleRef.current.scaleY };
    const current = { ...target };
    catalogLiveAngleRef.current = { ...target };
    let velocity = { rot: 0, scale: 0 };
    let dragging = false;
    let lastX = 0, lastY = 0;
    let rafId;
    let needsDraw = true;
    let lastStateVersion = -1;

    const draw = () => {
      const ds = catalogDrawStateRef.current;
      const bd = ds.backdropImage || generateBackdrop(ds.backdrop, canvas.width, canvas.height);
      const out = compositeAngle(
        productImage, bd,
        { rotation: current.rotation, scaleY: current.scaleY },
        ds.shadow, ds.reflection, ds.product, ds.backdropBlur || 0
      );
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(out, 0, 0);
    };

    const tick = () => {
      // Apply preset snap (from clicking an angle button)
      if (catalogPresetRef.current) {
        target.rotation = catalogPresetRef.current.rotation;
        target.scaleY = catalogPresetRef.current.scaleY;
        catalogPresetRef.current = null;
        catalogLiveAngleRef.current = { ...target };
        needsDraw = true;
      }
      // Redraw when upstream state (shadow, reflection, product, backdrop) changes
      if (catalogStateVersionRef.current !== lastStateVersion) {
        lastStateVersion = catalogStateVersionRef.current;
        needsDraw = true;
      }
      // Momentum: continue spinning after release, decaying smoothly
      if (!dragging) {
        if (Math.abs(velocity.rot) > 0.005 || Math.abs(velocity.scale) > 0.0005) {
          target.rotation = Math.max(-180, Math.min(180, target.rotation + velocity.rot));
          target.scaleY = Math.max(0.5, Math.min(1.1, target.scaleY + velocity.scale));
          catalogLiveAngleRef.current = { rotation: target.rotation, scaleY: target.scaleY };
          velocity.rot *= 0.93;
          velocity.scale *= 0.93;
          needsDraw = true;
        }
      }
      // Ease current toward target (lerp for fluid, lag-free follow)
      const lerp = 0.28;
      const dr = target.rotation - current.rotation;
      const ds = target.scaleY - current.scaleY;
      if (Math.abs(dr) > 0.02 || Math.abs(ds) > 0.001) {
        current.rotation += dr * lerp;
        current.scaleY += ds * lerp;
        needsDraw = true;
      } else {
        current.rotation = target.rotation;
        current.scaleY = target.scaleY;
      }
      // Track the DISPLAYED (eased) angle so "Generate your angle" captures
      // exactly what the user sees on screen, not the lagging target.
      catalogLiveAngleRef.current = { rotation: current.rotation, scaleY: current.scaleY };
      if (needsDraw) { draw(); needsDraw = false; }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // --- Pointer drag (mouse / single-finger touch) ---
    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      velocity = { rot: 0, scale: 0 };
      canvas.style.cursor = "grabbing";
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const onMove = (e) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - lastX) / rect.width;
      const dy = (e.clientY - lastY) / rect.height;
      const fine = e.shiftKey ? 0.25 : 1;
      const dRot = dx * 80 * fine;
      const dScale = -dy * 0.6 * fine;
      target.rotation = Math.max(-180, Math.min(180, target.rotation + dRot));
      target.scaleY = Math.max(0.5, Math.min(1.1, target.scaleY + dScale));
      catalogLiveAngleRef.current = { rotation: target.rotation, scaleY: target.scaleY };
      velocity.rot = velocity.rot * 0.6 + dRot * 0.4;
      velocity.scale = velocity.scale * 0.6 + dScale * 0.4;
      lastX = e.clientX; lastY = e.clientY;
    };
    const onUp = (e) => {
      dragging = false;
      canvas.style.cursor = "grab";
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    // --- Two-finger trackpad drag (wheel events) ---
    // Horizontal swipe → rotation, vertical swipe → tilt (scaleY).
    const onWheel = (e) => {
      e.preventDefault();
      const fine = e.shiftKey ? 0.25 : 1;
      let dx = e.deltaX, dy = e.deltaY;
      if (e.deltaMode === 1) { dx *= 16; dy *= 16; }
      const dRot = -dx * 0.35 * fine;
      const dScale = dy * 0.004 * fine;
      target.rotation = Math.max(-180, Math.min(180, target.rotation + dRot));
      target.scaleY = Math.max(0.5, Math.min(1.1, target.scaleY + dScale));
      catalogLiveAngleRef.current = { rotation: target.rotation, scaleY: target.scaleY };
      velocity.rot = velocity.rot * 0.6 + dRot * 0.4;
      velocity.scale = velocity.scale * 0.6 + dScale * 0.4;
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.style.cursor = "";
      // Save the TARGET angle (what the user aimed at), not the lagging eased
      // `current` value — otherwise navigating away mid-ease resets the angle.
      const savedAngle = { rotation: target.rotation, scaleY: target.scaleY };
      catalogAngleRef.current = savedAngle;
      catalogLiveAngleRef.current = savedAngle;
      setCatalogAngle(savedAngle);
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

  // ---- AI scene generation ----
  const generateScene = async (prompt) => {
    const p = (prompt || "").trim();
    if (!p || processing) return;
    if (!canvasSize.w) {
      notify("Upload a product image first", "error");
      return;
    }
    setAiGenerating(true);
    setProcessing(true);
    setProgress(null);
    setProcessingText("Generating AI scene…");
    try {
      const res = await base44.functions.invoke("generateScene", { prompt: p });
      const url = res?.data?.url;
      if (!url) throw new Error("No image returned");
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Could not fetch generated image");
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("Could not load generated image"));
        im.src = objUrl;
      });
      const { canvas, ctx } = createCanvas(canvasSize.w, canvasSize.h);
      const scale = Math.max(canvasSize.w / img.width, canvasSize.h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (canvasSize.w - dw) / 2, (canvasSize.h - dh) / 2, dw, dh);
      URL.revokeObjectURL(objUrl);
      setBackdropImage(canvas);
      patch({ backdrop: "photo" });
      notify("AI scene generated — position your product into it");
    } catch (err) {
      notify("AI generation failed: " + (err.message || "Unknown error"), "error");
    } finally {
      setAiGenerating(false);
      setProcessing(false);
      setProcessingText("Processing...");
    }
  };

  // ---- AI model generation ----
  const generateModel = async (description) => {
    const d = (description || "").trim();
    if (!d || processing) return;
    if (!canvasSize.w) {
      notify("Upload a product image first", "error");
      return;
    }
    setAiGenerating(true);
    setProcessing(true);
    setProgress(null);
    setProcessingText("Generating AI model…");
    try {
      const res = await base44.functions.invoke("generateModel", { description: d });
      const url = res?.data?.url;
      if (!url) throw new Error("No image returned");
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Could not fetch generated image");
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("Could not load generated image"));
        im.src = objUrl;
      });
      const { canvas, ctx } = createCanvas(canvasSize.w, canvasSize.h);
      const scale = Math.max(canvasSize.w / img.width, canvasSize.h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (canvasSize.w - dw) / 2, (canvasSize.h - dh) / 2, dw, dh);
      URL.revokeObjectURL(objUrl);
      setOnModelImage(canvas);
      notify("AI model generated — position your product onto it");
    } catch (err) {
      notify("AI generation failed: " + (err.message || "Unknown error"), "error");
    } finally {
      setAiGenerating(false);
      setProcessing(false);
      setProcessingText("Processing...");
    }
  };

  // ---- batch processing ----
  const loadBatchFiles = async (files) => {
    const arr = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)
    );
    if (!arr.length) return;
    setProcessing(true);
    setProgress(null);
    setProcessingText("Loading images...");
    const newItems = [];
    for (const f of arr) {
      if (f.size > 20 * 1024 * 1024) continue;
      try {
        const image = await loadImageFromFile(f);
        newItems.push({
          id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: f.name,
          file: f,
          image,
          status: "pending",
        });
      } catch (_) {}
    }
    if (newItems.length) {
      setBatchItems((prev) => [...prev, ...newItems]);
      if (!batchPreviewOriginal) {
        const first = newItems[0];
        setBatchPreviewOriginal(first.image);
        let w = first.image.naturalWidth;
        let h = first.image.naturalHeight;
        const maxDim = 2048;
        if (Math.max(w, h) > maxDim) {
          const sc = maxDim / Math.max(w, h);
          w = Math.round(w * sc);
          h = Math.round(h * sc);
        }
        setCanvasSize({ w, h });
        setProcessingText("Preparing preview...");
        try {
          await loadBgRemovalLibrary();
          const rb = await removeBackground(first.image, { model: s.bgModel });
          setBatchPreviewProduct(await loadImageFromBlob(rb));
        } catch (_) {}
      }
    }
    setProcessing(false);
    setProgress(null);
  };

  const removeBatchItem = (id) => {
    setBatchItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      if (idx === 0) {
        if (next.length) {
          const first = next[0];
          setBatchPreviewOriginal(first.image);
          let w = first.image.naturalWidth;
          let h = first.image.naturalHeight;
          const maxDim = 2048;
          if (Math.max(w, h) > maxDim) {
            const sc = maxDim / Math.max(w, h);
            w = Math.round(w * sc);
            h = Math.round(h * sc);
          }
          setCanvasSize({ w, h });
          setBatchPreviewProduct(null);
          loadBgRemovalLibrary()
            .then(() => removeBackground(first.image, { model: s.bgModel }))
            .then(loadImageFromBlob)
            .then(setBatchPreviewProduct)
            .catch(() => {});
        } else {
          setBatchPreviewOriginal(null);
          setBatchPreviewProduct(null);
        }
      }
      return next;
    });
  };

  const clearBatch = () => {
    setBatchItems([]);
    setBatchPreviewOriginal(null);
    setBatchPreviewProduct(null);
  };

  const processBatch = async () => {
    if (!batchItems.length || processing) return;
    setProcessing(true);
    setProgress(0);
    setProcessingText("Preparing batch...");
    try {
      await loadBgRemovalLibrary();
    } catch (err) {
      notify("Could not load AI model", "error");
      setProcessing(false);
      setProgress(null);
      return;
    }
    let done = 0;
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      setBatchProgress({ current: i + 1, total: batchItems.length });
      setProcessingText(`Processing ${i + 1}/${batchItems.length}: ${item.name}`);
      setProgress(Math.round((i / batchItems.length) * 100));
      setBatchItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "processing" } : it))
      );
      try {
        const rb = await removeBackground(item.image, { model: s.bgModel });
        const product = await loadImageFromBlob(rb);
        let w = item.image.naturalWidth;
        let h = item.image.naturalHeight;
        const maxDim = 2048;
        if (Math.max(w, h) > maxDim) {
          const sc = maxDim / Math.max(w, h);
          w = Math.round(w * sc);
          h = Math.round(h * sc);
        }
        const bd =
          s.backdrop === "custom-color"
            ? generateColorBackdrop(s.customColor, w, h)
            : generateBackdrop(s.backdrop, w, h);
        const comp = compositeProduct(product, bd, s.shadow, s.reflection, s.product);
        applyRelighting(comp, s.relight);
        const base = item.name.replace(/\.[^.]+$/, "");
        exportToPreset(comp, s.exportPreset, s.exportFormat, (s.exportQuality || 92) / 100, s.customW, s.customH, base);
        done++;
        setBatchItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: "done" } : it))
        );
        await new Promise((r) => setTimeout(r, 400));
      } catch (_) {
        setBatchItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: "error" } : it))
        );
      }
    }
    setProgress(100);
    setBatchProgress(null);
    setProcessing(false);
    setProcessingText("Processing...");
    notify(`Batch complete: ${done}/${batchItems.length} exported`);
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
        const angles = generateCatalog(productImage, bd, s.shadow, s.reflection, s.product, s.backdropBlur || 0, catalogLiveAngleRef.current);
        setCatalogAngles(angles);
        notify("Catalog generated");
      } catch (err) {
        notify("Catalog generation failed: " + err.message, "error");
      } finally {
        setProcessing(false);
      }
    }, 80);
  };

  const generateCustomAngleImg = () => {
    if (!productImage) {
      notify("Remove background first", "error");
      return;
    }
    let bd = backdropImage;
    if (!bd && canvasSize.w) {
      bd = generateBackdrop(s.backdrop, canvasSize.w, canvasSize.h);
      setBackdropImage(bd);
    }
    try {
      const canvas = compositeAngle(
        productImage, bd, catalogLiveAngleRef.current,
        s.shadow, s.reflection, s.product, s.backdropBlur || 0
      );
      const entry = { angle: "custom", label: "Your angle", dataURL: canvas.toDataURL("image/png") };
      setCatalogAngles([entry]);
      notify("Your angle generated");
    } catch (err) {
      notify("Generation failed: " + err.message, "error");
    }
  };

  const onCatalogThumb = (a) => {
    const key = a.key || a.angle;
    const t = angleTransforms[key];
    const newAngle = t ? { rotation: t.rotation || 0, scaleY: t.scaleY || 1 } : { rotation: 0, scaleY: 1 };
    setCatalogAngle(newAngle);
    catalogPresetRef.current = newAngle;
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
    if (preset) setS((prev) => ({ ...prev, relight: { ...prev.relight, preset: key, filter: "custom", ...preset } }));
  };
  const selectFilter = (key) => {
    const f = cameraFilters[key];
    if (f) setS((prev) => ({ ...prev, relight: { ...prev.relight, preset: "custom", filter: key, ...f } }));
  };
  const resetLighting = () => {
    setS((prev) => ({ ...prev, relight: { preset: "neutral", filter: "original", ...lightingPresets.neutral, ...cameraFilters.original } }));
    notify("Adjustments reset to neutral");
  };

  // ---- export ----
  const selectExportPreset = (key) => patch({ exportPreset: key });
  const doExport = () => {
    if (!canvasRef.current || !originalImage) {
      notify("No image to export", "error");
      return;
    }
    exportToPreset(canvasRef.current, s.exportPreset, s.exportFormat, (s.exportQuality || 92) / 100, s.customW, s.customH);
    notify("Image exported successfully");
  };

  // ---- mode switch ----
  const onModeChange = (m) => {
    setS((prev) => ({ ...prev, mode: m }));
    if (m === "studio") setCurrentStep("upload");
    else setCurrentTool("filters");
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
    else if (mode === "batch") processBatch();
    else setCurrentTool("export");
  };

  const STEP_ORDER = ["upload", "remove-bg", "backdrop", "effects", "catalog", "on-model", "export"];

  // Next step: persists ALL current adjustments (shadow, reflection, position,
  // backdrop, catalog angle, on-model settings) and advances to the next step.
  // Nothing is reset — the state lives in `s` and carries over to every step.
  const nextStep = () => {
    // If on the catalog step, flush the live rotation angle into state so it
    // persists when we leave the catalog RAF loop.
    if (currentStep === "catalog") {
      setCatalogAngle({ ...catalogLiveAngleRef.current });
    }
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx >= 0 && idx < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[idx + 1]);
      toast({ title: "Step saved", description: "Your adjustments have been preserved." });
    }
  };

  // Discard the current step's adjustments, then advance.
  const resetStepState = (step) => {
    if (step === "backdrop") {
      patch({ backdrop: "studio-white", customColor: "#7B6FE0", backdropBlur: 0 });
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
      setOnModelImage(null);
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
      generateScene,
      generateModel,
      generateCatalog: generateCatalogImgs,
      generateCustomAngle: generateCustomAngleImg,
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
      selectFilter,
      resetLighting,
      export: doExport,
      selectExportPreset,
    },
  };

  const batchActions = {
    addImages: () => batchImagesInputRef.current?.click(),
    addFolder: () => batchFolderInputRef.current?.click(),
    selectBackdrop,
    selectCustomColor,
    selectLighting,
    selectExportPreset,
    clearBatch,
    processBatch,
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
    setExportQuality: (v) => patch({ exportQuality: v }),
    setBackdropBlur: (v) => patch({ backdropBlur: v }),
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
      <input
        ref={batchImagesInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files.length) loadBatchFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={batchFolderInputRef}
        type="file"
        {...{ webkitdirectory: "", directory: "" }}
        hidden
        onChange={(e) => {
          if (e.target.files.length) loadBatchFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Topbar mode={mode} onModeChange={onModeChange} hasImage={hasImage} onExportClick={onExportClick} onPresetsClick={() => setShowPresets(true)} />
      {showPresets && (
        <PresetModal
          currentSettings={presetSettings}
          onApply={applyPreset}
          onClose={() => setShowPresets(false)}
        />
      )}
      <div className="kv-layout">
        {mode === "batch" ? (
          <BatchSidebar items={batchItems} onRemove={removeBatchItem} onClear={clearBatch} processing={processing} />
        ) : (
          <Sidebar mode={mode} current={mode === "studio" ? currentStep : currentTool} onSelect={onSidebarSelect} />
        )}
        {mode === "batch" ? (
          <BatchCanvasArea
            hasItems={batchItems.length > 0}
            onFiles={loadBatchFiles}
            processing={processing}
            processingText={processingText}
            progress={progress}
            canvasRef={canvasRef}
          />
        ) : (
          <CanvasArea
            hasImage={hasImage}
            onFile={loadFile}
            processing={processing}
            processingText={processingText}
            progress={progress}
            canvasRef={canvasRef}
            originalImage={originalImage}
          />
        )}
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
              aiGenerating={aiGenerating}
              onModelImage={onModelImage}
              canvasRef={canvasRef}
            />
          ) : mode === "retouch" ? (
            <RetouchControls tool={currentTool} state={s} actions={actions.retouch} setters={setters} originalImage={originalImage} />
          ) : (
            <BatchControls
              state={s}
              setters={setters}
              actions={batchActions}
              items={batchItems}
              processing={processing}
              progress={batchProgress}
            />
          )}
        </aside>
      </div>
    </div>
  );
}