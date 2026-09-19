import { useRef, useState, useEffect, useCallback } from "react";

// Debounced auto-commit history for a snapshot of state.
// Groups rapid changes (e.g. slider drags) into a single undo entry.
export function useHistory(state, snapshotFields, delay = 450) {
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const committedRef = useRef(snapshotFields(state));
  const timerRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const commit = useCallback((snap) => {
    const prev = committedRef.current;
    if (JSON.stringify(prev) === JSON.stringify(snap)) return;
    pastRef.current.push(prev);
    if (pastRef.current.length > 40) pastRef.current.shift();
    committedRef.current = snap;
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // Debounced: commit a snapshot shortly after state stops changing.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(snapshotFields(state)), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);

  const undo = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const h = pastRef.current;
    if (!h.length) return null;
    futureRef.current.push(committedRef.current);
    const prev = h.pop();
    committedRef.current = prev;
    setCanUndo(h.length > 0);
    setCanRedo(true);
    return prev;
  }, []);

  const redo = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const f = futureRef.current;
    if (!f.length) return null;
    pastRef.current.push(committedRef.current);
    const next = f.pop();
    committedRef.current = next;
    setCanUndo(true);
    setCanRedo(f.length > 0);
    return next;
  }, []);

  return { undo, redo, canUndo, canRedo, commit };
}