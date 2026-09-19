import React, { useState } from "react";
import { Sparkles, X, Copy, Check, Loader2, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { getExportBlob } from "@/lib/kanvasly/exportUtils";

const PLATFORMS = [
  { key: "shopify", label: "Shopify" },
  { key: "amazon", label: "Amazon" },
  { key: "instagram", label: "Instagram" },
  { key: "etsy", label: "Etsy" },
];

function CopyBlock({ label, value, k, copied, onCopy }) {
  return (
    <div style={{ background: "var(--kv-input)", border: "1px solid var(--kv-border)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--kv-text-tertiary)" }}>
          {label}
        </span>
        <button
          onClick={() => onCopy(value, k)}
          style={{ background: "transparent", border: "none", color: copied === k ? "var(--kv-accent)" : "var(--kv-text-secondary)", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500 }}
        >
          {copied === k ? <Check size={13} /> : <Copy size={13} />}
          {copied === k ? "Copied" : "Copy"}
        </button>
      </div>
      <div style={{ fontSize: 13, color: "var(--kv-text)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {value}
      </div>
    </div>
  );
}

export default function ListingModal({ canvasRef, onClose }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);
  const [platform, setPlatform] = useState("shopify");

  const generate = async () => {
    if (!canvasRef?.current || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const blob = await getExportBlob(canvasRef.current, "instagram-square", "image/jpeg", 0.9);
      if (!blob) throw new Error("Could not generate image");
      const file = new File([blob], `product-${Date.now()}.jpg`, { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const res = await base44.functions.invoke("generateProductDescription", { imageUrl: file_url, platform });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      if (!data?.title) throw new Error("No copy generated");
      setResult(data);
    } catch (e) {
      toast({ title: "Generation failed: " + (e.message || "Unknown error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = () => {
    if (!result) return;
    const all = [
      `Title: ${result.title}`,
      ``,
      `Short description: ${result.shortDescription}`,
      ``,
      `Description:`,
      result.description,
      ``,
      `Keywords: ${(result.keywords || []).join(", ")}`,
      ``,
      `Features:`,
      ...(result.bullets || []).map((b) => `• ${b}`),
    ].join("\n");
    copy(all, "all");
    toast({ title: "Full listing copied" });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(11, 9, 24, 0.7)",
        backdropFilter: "blur(6px)", zIndex: 200, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 92vw)", maxHeight: "84vh", background: "var(--kv-surface)",
          border: "1px solid var(--kv-border-strong)", borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--kv-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} className="text-kanvasly-accent" />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--kv-text)" }}>AI Product Listing</h3>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--kv-text-tertiary)", cursor: "pointer", padding: 4, borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--kv-border)" }}>
          <p style={{ fontSize: 12, color: "var(--kv-text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
            Generate SEO-optimized product copy from your current image — title, descriptions, keywords, and feature bullets.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPlatform(p.key)}
                style={{
                  padding: "6px 12px", fontSize: 12, fontWeight: 500, borderRadius: 999, cursor: "pointer",
                  border: "1px solid", transition: "all 150ms ease",
                  background: platform === p.key ? "linear-gradient(135deg, var(--kv-primary), var(--kv-primary-dark))" : "var(--kv-input)",
                  color: platform === p.key ? "#fff" : "var(--kv-text-secondary)",
                  borderColor: platform === p.key ? "transparent" : "var(--kv-border-strong)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={loading} className="kv-btn-primary" style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? "Analyzing product…" : "Generate listing"}
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "12px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {!result && !loading && (
            <p style={{ fontSize: 13, color: "var(--kv-text-tertiary)", textAlign: "center", padding: 24 }}>
              Click "Generate listing" to create product copy from your image.
            </p>
          )}
          {result && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={copyAll} className="kv-btn-secondary" style={{ padding: "6px 12px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {copied === "all" ? <Check size={13} /> : <Copy size={13} />} Copy all
                </button>
              </div>
              <CopyBlock label="Title" value={result.title} k="title" copied={copied} onCopy={copy} />
              <CopyBlock label="Short description" value={result.shortDescription} k="short" copied={copied} onCopy={copy} />
              <CopyBlock label="Description" value={result.description} k="desc" copied={copied} onCopy={copy} />
              <CopyBlock label="Keywords" value={(result.keywords || []).join(", ")} k="kw" copied={copied} onCopy={copy} />
              <CopyBlock label="Features" value={(result.bullets || []).map((b) => `• ${b}`).join("\n")} k="bullets" copied={copied} onCopy={copy} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}