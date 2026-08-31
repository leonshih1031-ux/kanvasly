import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CONNECTOR_ID = "6a95508d2ec4a8ec6e06200a";
const FOLDER_NAME = "Kanvasly Exports";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Get the current app user's Google Drive connection.
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Google Drive not connected', notConnected: true }, { status: 401 });
    }

    // Connection check only.
    if (body.checkOnly) {
      return Response.json({ connected: true });
    }

    if (!body.fileUrl || !body.fileName) {
      return Response.json({ error: 'fileUrl and fileName are required' }, { status: 400 });
    }

    // Fetch the uploaded file content.
    const fileRes = await fetch(body.fileUrl);
    if (!fileRes.ok) return Response.json({ error: 'Could not fetch file' }, { status: 502 });
    const fileBlob = await fileRes.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    const mimeType = body.mimeType || fileBlob.type || 'image/png';

    // Find or create the "Kanvasly Exports" folder (best-effort; fall back to root).
    const folderId = await findOrCreateFolder(accessToken, FOLDER_NAME);

    // Multipart upload to Google Drive.
    const boundary = 'kvly_' + Math.random().toString(36).slice(2);
    const metadata = JSON.stringify({ name: body.fileName, ...(folderId ? { parents: [folderId] } : {}) });
    const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
    const filePart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const closing = `\r\n--${boundary}--`;

    const encoder = new TextEncoder();
    const metadataBytes = encoder.encode(metadataPart);
    const fileHeaderBytes = encoder.encode(filePart);
    const closingBytes = encoder.encode(closing);
    const fileBytes = new Uint8Array(arrayBuffer);

    const combined = new Uint8Array(
      metadataBytes.length + fileHeaderBytes.length + fileBytes.length + closingBytes.length
    );
    combined.set(metadataBytes, 0);
    combined.set(fileHeaderBytes, metadataBytes.length);
    combined.set(fileBytes, metadataBytes.length + fileHeaderBytes.length);
    combined.set(closingBytes, metadataBytes.length + fileHeaderBytes.length + fileBytes.length);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: combined,
      }
    );
    const data = await uploadRes.json();
    if (!uploadRes.ok) {
      return Response.json({ error: data.error?.message || 'Upload failed' }, { status: uploadRes.status });
    }

    return Response.json({ fileId: data.id, webViewLink: data.webViewLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function findOrCreateFolder(accessToken, name) {
  try {
    const q = `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await res.json();
    if (data.files && data.files.length > 0) return data.files[0].id;
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }),
    });
    const created = await createRes.json();
    return created.id;
  } catch (e) {
    return null;
  }
}