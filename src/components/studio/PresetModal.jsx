import React, { useEffect, useState } from "react";
import { Bookmark, X, Trash2, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function PresetModal({ currentSettings, onApply, onClose }) {
  const { toast } = useToast();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Preset.list("-created_date", 100);
      setPresets(list);
    } catch (err) {
      toast({ title: "Could not load presets", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const n = name.trim();
    if (!n) {
      toast({ title: "Give your preset a name", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Preset.create({ name: n, settings: currentSettings });
      setName("");
      await load();
      toast({ title: "Preset saved" });
    } catch (err) {
      toast({ title: "Save failed: " + (err.message || "Unknown error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await base44.entities.Preset.delete(id);
      await load();
      toast({ title: "Preset deleted" });
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const apply = (preset) => {
    onApply(preset.settings);
    setActiveId(preset.id);
    setTimeout(() => setActiveId(null), 1200);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11, 9, 24, 0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px, 92vw)",
          maxHeight: "80vh",
          background: "var(--kv-surface)",
          border: "1px solid var(--kv-border-strong)",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid var(--kv-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bookmark size={16} className="text-kanvasly-accent" />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--kv-text)" }}>
              Style Presets
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--kv-text-tertiary)",
              cursor: "pointer",
              padding: 4,
              borderRadius: 8,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--kv-border)" }}>
          <p
            style={{
              fontSize: 12,
              color: "var(--kv-text-secondary)",
              marginBottom: 10,
              lineHeight: 1.5,
            }}
          >
            Save the current shadow, lighting, and composition as a reusable template.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="kv-input"
              placeholder="Preset name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !saving && save()}
              style={{ flex: 1 }}
            />
            <button
              onClick={save}
              disabled={saving || !name.trim()}
              className="kv-btn-primary"
              style={{ padding: "9px 16px", whiteSpace: "nowrap" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "8px 12px", flex: 1 }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 24,
                color: "var(--kv-text-tertiary)",
              }}
            >
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : presets.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--kv-text-tertiary)",
                textAlign: "center",
                padding: 24,
              }}
            >
              No presets yet — save your current settings to get started.
            </p>
          ) : (
            presets.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  marginBottom: 4,
                  background: "var(--kv-input)",
                  border: "1px solid var(--kv-border)",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "var(--kv-text)",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </span>
                {activeId === p.id ? (
                  <Check size={15} className="text-kanvasly-accent" />
                ) : (
                  <button
                    onClick={() => apply(p)}
                    className="kv-btn-secondary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Apply
                  </button>
                )}
                <button
                  onClick={() => remove(p.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--kv-text-tertiary)",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}