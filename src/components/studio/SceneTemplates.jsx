import React from "react";
import { sceneTemplates } from "@/lib/kanvasly/sceneTemplates";
import { cn } from "@/lib/utils";

// One-click curated AI scene gallery. Clicking a template calls the existing
// generateScene flow with a pre-written, refined prompt.
export default function SceneTemplates({ onGenerate, aiGenerating }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] text-kanvasly-secondary">AI scene templates</label>
      <div className="grid grid-cols-3 gap-1.5">
        {sceneTemplates.map((t) => (
          <button
            key={t.key}
            type="button"
            disabled={aiGenerating}
            onClick={() => onGenerate(t.prompt)}
            title={t.label}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg border border-white/10 bg-kanvasly-input hover:border-kanvasly-primary hover:bg-kanvasly-surface-hover transition-all",
              aiGenerating && "opacity-40 pointer-events-none"
            )}
          >
            <span className="text-[18px] leading-none">{t.emoji}</span>
            <span className="text-[10px] text-kanvasly-secondary text-center leading-tight">
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}