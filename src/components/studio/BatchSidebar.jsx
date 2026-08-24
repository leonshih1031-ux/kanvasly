import React from "react";
import { Trash2, Check, Loader2, AlertCircle, Clock } from "lucide-react";

const StatusIcon = ({ status }) => {
  if (status === "done") return <Check size={13} />;
  if (status === "processing") return <Loader2 size={13} className="animate-spin" />;
  if (status === "error") return <AlertCircle size={13} />;
  return <Clock size={13} />;
};

export default function BatchSidebar({ items, onRemove, onClear, processing }) {
  return (
    <aside className="kv-sidebar">
      <div className="kv-sidebar-section">
        <h3 className="kv-sidebar-title">Batch ({items.length})</h3>
        {items.length === 0 && (
          <p className="px-3 text-[12px] text-kanvasly-tertiary leading-relaxed">
            No images yet. Upload a folder or images to begin.
          </p>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="kv-step"
            style={{ cursor: "default", marginBottom: 2 }}
          >
            <span className="kv-step-num">
              <StatusIcon status={it.status} />
            </span>
            <span
              className="kv-step-label"
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={it.name}
            >
              {it.name}
            </span>
            {!processing && (
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                className="ml-auto text-kanvasly-tertiary hover:text-kanvasly-primary-text"
                title="Remove"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        {items.length > 0 && !processing && (
          <button
            type="button"
            className="kv-step"
            onClick={onClear}
            style={{ color: "var(--kv-text-tertiary)", marginTop: 6 }}
          >
            <span className="kv-step-num">
              <Trash2 size={13} />
            </span>
            <span className="kv-step-label">Clear all</span>
          </button>
        )}
      </div>
    </aside>
  );
}