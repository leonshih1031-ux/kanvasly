// Lightweight JPEG EXIF reader for the pro photo overlay.
// Extracts camera model, ISO, aperture, focal length, and exposure time
// from the APP1 (EXIF) segment without any external dependency.

function readRational(view, offset, little) {
  const num = view.getUint32(offset, little);
  const den = view.getUint32(offset + 4, little);
  return den ? num / den : 0;
}

function parseIFD(view, ifdOffset, tiffStart, little, result) {
  const count = view.getUint16(ifdOffset, little);
  let exifIFD = 0;
  for (let i = 0; i < count; i++) {
    const entry = ifdOffset + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const numValues = view.getUint32(entry + 4, little);
    const valOff = entry + 8;

    let value = null;
    switch (type) {
      case 2: {
        const strOff = numValues > 4 ? view.getUint32(valOff, little) + tiffStart : valOff;
        let s = "";
        for (let j = 0; j < numValues - 1 && strOff + j < view.byteLength; j++) {
          s += String.fromCharCode(view.getUint8(strOff + j));
        }
        value = s;
        break;
      }
      case 3:
        value = view.getUint16(valOff, little);
        break;
      case 4:
        value = view.getUint32(valOff, little);
        break;
      case 5:
        value = readRational(view, view.getUint32(valOff, little) + tiffStart, little);
        break;
      default:
        value = null;
    }
    if (value !== null) result[tag] = value;
    if (tag === 0x8769 && type === 4) exifIFD = view.getUint32(valOff, little) + tiffStart;
  }
  return exifIFD;
}

export async function readExif(file) {
  if (!file) return null;
  const isJpeg = file.type === "image/jpeg" || /\.(jpe?g)$/i.test(file.name || "");
  if (!isJpeg) return null;
  try {
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

    let offset = 2;
    let exifStart = -1;
    while (offset < view.byteLength - 10) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);
      if (marker === 0xe1 && view.getUint32(offset + 4) === 0x45786966) {
        exifStart = offset + 10;
        break;
      }
      const size = view.getUint16(offset + 2);
      if (size < 2) break;
      offset += 2 + size;
    }
    if (exifStart < 0) return null;

    const tiffStart = exifStart;
    const byteOrder = view.getUint16(tiffStart);
    const little = byteOrder === 0x4949;
    if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return null;

    const ifdOffset = view.getUint32(tiffStart + 4, little) + tiffStart;
    const result = {};
    const exifIFD = parseIFD(view, ifdOffset, tiffStart, little, result);
    if (exifIFD) parseIFD(view, exifIFD, tiffStart, little, result);

    const out = {};
    if (result[0x010f]) out.model = String(result[0x010f]).trim();
    if (result[0x8827]) out.iso = result[0x8827];
    if (result[0x829d]) out.aperture = "f/" + Number(result[0x829d]).toFixed(1);
    if (result[0x920a]) out.focalLength = Math.round(result[0x920a]) + "mm";
    if (result[0x829a]) {
      const et = result[0x829a];
      out.exposure = et < 1 ? "1/" + Math.round(1 / et) : et.toFixed(1) + "s";
    }
    return out;
  } catch (e) {
    return null;
  }
}