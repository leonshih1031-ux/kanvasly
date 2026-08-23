import React, { useEffect, useRef, useState, useCallback } from "react";
import { MoveHorizontal } from "lucide-react";

// Overlays the original ("before") image on top of the live edited canvas and
// clips it to the left of a draggable divider, so the right side reveals the
// edited result underneath. The overlay is sized to match the canvas's rendered
// box via offsetLeft/offsetTop/offsetWidth/offsetHeight + a ResizeObserver.
export default function CompareSlider({ originalImage, canvasRef }) {
  const [pos, setPos] = useState(50);
  const [box, setBox] = useState(null);
  const dragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const update = () =>
      setBox({
        left: canvas.offsetLeft,
        top: canvas.offsetTop,
        w: canvas.offsetWidth,
        h: canvas.offsetHeight,
      });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [canvasRef, originalImage]);

  const move = useCallback((clientX) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, [canvasRef]);

  const onDown = (e) => {
    dragging.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    move(e.clientX);
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    move(e.clientX);
  };
  const onUp = (e) => {
    dragging.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  if (!box) return null;

  return (
    <div
      className="kv-compare-overlay"
      style={{ left: box.left, top: box.top, width: box.w, height: box.h }}
    >
      <img
        src={originalImage.src}
        className="kv-compare-before"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        alt="Before"
        draggable={false}
      />
      <span className="kv-compare-label kv-compare-label-before">Before</span>
      <span className="kv-compare-label kv-compare-label-after">After</span>
      <div
        className="kv-compare-divider"
        style={{ left: `${pos}%` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="kv-compare-line" />
        <div className="kv-compare-handle">
          <MoveHorizontal size={15} />
        </div>
      </div>
    </div>
  );
}