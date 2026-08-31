import React, { useEffect, useRef, useState } from "react";
import { Cloud, Link2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { getExportBlob } from "@/lib/kanvasly/exportUtils";

const CONNECTOR_ID = "6a95508d2ec4a8ec6e06200a";

export default function DriveExport({ canvasRef, state }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState(null);
  const popupRef = useRef(null);

  const notify = (title, variant) =>
    toast({ title, variant: variant === "error" ? "destructive" : "default" });

  // Rule 2: connection status is detected by calling the backend function.
  const checkConnection = async () => {
    try {
      const res = await base44.functions.invoke("uploadToDrive", { checkOnly: true });
      if (res?.data?.connected) setConnected(true);
      else setConnected(false);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Rule 3: open OAuth in a popup, then re-check when it closes.
  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      popupRef.current = popup;
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection();
        }
      }, 500);
    } catch {
      notify("Could not start Google Drive connection", "error");
    }
  };

  const handleUpload = async () => {
    if (!canvasRef?.current || uploading) return;
    setUploading(true);
    setLink(null);
    try {
      const blob = await getExportBlob(
        canvasRef.current,
        state.exportPreset,
        state.exportFormat,
        (state.exportQuality || 92) / 100,
        state.customW,
        state.customH
      );
      if (!blob) throw new Error("Could not generate image");
      const ext = state.exportFormat.split("/")[1];
      const file = new File([blob], `kanvasly-${Date.now()}.${ext}`, { type: state.exportFormat });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke("uploadToDrive", {
        fileUrl: file_url,
        fileName: file.name,
        mimeType: state.exportFormat,
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      setLink(data.webViewLink);
      notify("Uploaded to Google Drive");
    } catch (e) {
      notify("Drive upload failed: " + (e.message || "Unknown error"), "error");
    } finally {
      setUploading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-kanvasly-tertiary">
        <Loader2 size={14} className="animate-spin" /> Checking Google Drive…
      </div>
    );
  }

  if (!connected) {
    return (
      <button className="kv-btn-secondary kv-btn-full" onClick={handleConnect}>
        <span className="inline-flex items-center gap-2">
          <Cloud size={15} /> Connect Google Drive
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className="kv-btn-primary kv-btn-full"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "Upload to Google Drive"}
      </button>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-kanvasly-accent flex items-center gap-1 justify-center"
        >
          <Link2 size={11} /> Open in Drive
        </a>
      )}
    </div>
  );
}