import { encode } from "uqr";

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

export interface QrOptions {
  /** Error-correction level. Default "M" (survives ~15% damage, still compact for URLs). */
  ecc?: QrErrorCorrection;
  /** Quiet zone around the code, in modules. Default 4 (what the QR spec asks for). */
  margin?: number;
  /** Module colour. Default "#000000". Keep it dark on light for scanners. */
  dark?: string;
  /** Background colour. Default "#ffffff". */
  light?: string;
}

/** The QR code as a square boolean matrix (true = dark module), without quiet zone. */
export function qrMatrix(text: string, ecc: QrErrorCorrection = "M"): boolean[][] {
  return encode(text, { ecc, border: 0 }).data;
}

/**
 * Render a QR code as an SVG string. The SVG has a viewBox and no fixed size,
 * so it scales to whatever box it is placed in.
 */
export function qrSvg(text: string, options: QrOptions = {}): string {
  const { ecc = "M", margin = 4, dark = "#000000", light = "#ffffff" } = options;
  const matrix = qrMatrix(text, ecc);
  const size = matrix.length + margin * 2;
  let path = "";
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      // Merge horizontal runs of dark modules into one rectangle.
      const start = x;
      while (x < row.length && row[x]) x++;
      path += `M${start + margin} ${y + margin}h${x - start}v1h${start - x}z`;
    }
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="${attr(light)}"/>` +
    `<path d="${path}" fill="${attr(dark)}"/>` +
    `</svg>`
  );
}

/**
 * Draw a QR code onto a canvas and return it as a PNG Blob (browser only).
 * `scale` is the number of pixels per module; the default gives ~300–400px images.
 */
export function qrPngBlob(text: string, options: QrOptions & { scale?: number } = {}): Promise<Blob> {
  const { ecc = "M", margin = 4, dark = "#000000", light = "#ffffff", scale = 10 } = options;
  const doc = globalThis.document as Document | undefined;
  if (!doc) return Promise.reject(new Error("qrPngBlob needs a browser (document is not available)"));

  const matrix = qrMatrix(text, ecc);
  const modules = matrix.length + margin * 2;
  const canvas = doc.createElement("canvas");
  canvas.width = canvas.height = modules * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas 2D context is not available"));

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = dark;
  matrix.forEach((row, y) => {
    row.forEach((on, x) => {
      if (on) ctx.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale);
    });
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))), "image/png");
  });
}

function attr(value: string): string {
  return value.replace(/[&"<>]/g, (c) => `&#${c.charCodeAt(0)};`);
}
