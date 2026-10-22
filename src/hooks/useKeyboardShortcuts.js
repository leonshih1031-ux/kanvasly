import { useEffect, useRef } from "react";

export const IS_MAC =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");

export const MOD_LABEL = IS_MAC ? "⌘" : "Ctrl";
export const SHIFT_LABEL = IS_MAC ? "⇧" : "Shift";

// Canonical combo order is mod+alt+shift+key, e.g. "mod+shift+z", "mod+enter", "?", "1".
function combosFor(e) {
  const key = (e.key || "").toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  const out = [];
  for (const shift of [true, false]) {
    if (shift && !e.shiftKey) continue;
    const parts = [];
    if (mod) parts.push("mod");
    if (e.altKey) parts.push("alt");
    if (shift) parts.push("shift");
    parts.push(key);
    out.push(parts.join("+"));
  }
  return out;
}

// True when the keystroke belongs to the field the user is typing in. Sliders,
// color pickers and checkboxes keep shortcuts alive so the flow never stalls
// after a control is touched.
function isTyping(el) {
  const tag = (el?.tagName || "").toLowerCase();
  if (tag === "textarea" || tag === "select" || el?.isContentEditable) return true;
  if (tag !== "input") return false;
  const type = (el.type || "text").toLowerCase();
  return !["range", "checkbox", "radio", "color", "file", "button", "submit", "reset"].includes(type);
}

// Registers global keyboard shortcuts from a { combo: handler } map.
export function useKeyboardShortcuts(map, { enabled = true } = {}) {
  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (isTyping(e.target)) return;
      const handlers = mapRef.current || {};
      for (const combo of combosFor(e)) {
        const handler = handlers[combo];
        if (handler) {
          e.preventDefault();
          handler(e);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}