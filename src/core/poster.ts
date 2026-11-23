import { qrMatrix } from "./qr.ts";

/**
 * Share posters: one image with the item's photo, title, price and a QR code
 * that opens the link. Apps that don't turn links into cards (WeChat chats,
 * Instagram Stories) still show this nicely, and anyone can scan the code.
 */

export type PosterFormat = "card" | "story" | "square";

export interface PosterOptions {
  /** The link the QR code opens. Shorter links make bigger, easier-to-scan modules. */
  url: string;
  title: string;
  /** Bold accent line, e.g. a price ("$70"). */
  subtitle?: string;
  /** Muted line, e.g. "New · Livingston · Pickup". */
  meta?: string;
  /** Photo URL (needs CORS, e.g. Access-Control-Allow-Origin: *) or data: URL. */
  image?: string;
  /** Site or brand name shown next to the QR code. */
  brand?: string;
  /** Line under the brand, e.g. "Scan to view". */
  caption?: string;
  /** Accent colour for the subtitle and brand. Default "#111111". */
  accent?: string;
  /** "card" 1080×1350 (4:5, chats and feeds), "story" 1080×1920 (9:16), "square" 1080×1080. */
  format?: PosterFormat;
  /** CSS font family list. The font must already be loaded on the page. */
  font?: string;
}

const SIZES: Record<PosterFormat, [number, number]> = {
  card: [1080, 1350],
  story: [1080, 1920],
  square: [1080, 1080],
};

const DEFAULT_FONT = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;

/** Draw a poster onto a new canvas (browser only). */
export async function posterCanvas(options: PosterOptions): Promise<HTMLCanvasElement> {
  const doc = globalThis.document as Document | undefined;
  if (!doc) throw new Error("posterCanvas needs a browser (document is not available)");

  const format = options.format ?? "card";
  const [W, H] = SIZES[format];
  const font = options.font ?? DEFAULT_FONT;
  const accent = options.accent ?? "#111111";
  const canvas = doc.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");

  const photo = options.image ? await loadImage(options.image) : null;

  // Story format: a soft tinted backdrop with the card centred on it.
  let x0 = 0;
  let y0 = 0;
  let w = W;
  let h = H;
  if (format === "story") {
    ctx.fillStyle = tint(accent, 0.12);
    ctx.fillRect(0, 0, W, H);
    w = 960;
    h = 1440;
    x0 = (W - w) / 2;
    y0 = (H - h) / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 16;
    roundRect(ctx, x0, y0, w, h, 48);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
  }

  const pad = format === "story" ? 56 : 64;
  const innerX = x0 + pad;
  const innerW = w - pad * 2;
  let y = y0 + pad;

  // QR code: big enough to survive chat apps shrinking the image to ~720 px wide
  // (≥ 4 px per module), with a 4-module quiet zone.
  const qrSize = format === "story" ? 280 : 300;
  // Photo (cover-cropped, rounded) — or a tinted block when there is none.
  const footerH = qrSize + 40;
  const textH = 56 * 2 + 16 + (options.subtitle ? 84 : 0) + (options.meta ? 56 : 0) + 24;
  const photoH = Math.max(240, h - pad * 2 - footerH - textH - 32);
  ctx.save();
  roundRect(ctx, innerX, y, innerW, photoH, 36);
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, innerX, y, innerW, photoH);
  } else {
    ctx.fillStyle = tint(accent, 0.1);
    ctx.fillRect(innerX, y, innerW, photoH);
  }
  ctx.restore();
  y += photoH + 44;

  // Title (up to two lines), subtitle, meta.
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "top";
  ctx.font = `700 52px ${font}`;
  for (const line of wrap(ctx, options.title.trim(), innerW, 2)) {
    ctx.fillText(line, innerX, y);
    y += 66;
  }
  if (options.subtitle) {
    y += 6;
    ctx.fillStyle = accent;
    ctx.font = `800 64px ${font}`;
    ctx.fillText(fit(ctx, options.subtitle.trim(), innerW), innerX, y);
    y += 84;
  }
  if (options.meta) {
    ctx.fillStyle = "#6b6b6b";
    ctx.font = `400 36px ${font}`;
    ctx.fillText(fit(ctx, options.meta.trim(), innerW), innerX, y);
  }

  // Footer: divider, brand + caption on the left, QR code on the right.
  const footerTop = y0 + h - pad - qrSize;
  ctx.fillStyle = "#ececec";
  ctx.fillRect(innerX, footerTop - 32, innerW, 2);
  drawQr(ctx, options.url, innerX + innerW - qrSize, footerTop, qrSize);
  const textW = innerW - qrSize - 32;
  let fy = footerTop + Math.max(24, qrSize / 2 - 70);
  if (options.brand) {
    ctx.fillStyle = accent;
    ctx.font = `800 44px ${font}`;
    ctx.fillText(fit(ctx, options.brand.trim(), textW), innerX, fy);
    fy += 64;
  }
  ctx.fillStyle = "#6b6b6b";
  ctx.font = `400 32px ${font}`;
  for (const line of wrap(ctx, options.caption ?? "Scan to view", textW, 2)) {
    ctx.fillText(line, innerX, fy);
    fy += 44;
  }

  return canvas;
}

/** Render the poster as a PNG Blob (browser only). */
export async function posterBlob(options: PosterOptions): Promise<Blob> {
  const canvas = await posterCanvas(options);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))), "image/png");
  });
}

/**
 * Break text into at most `maxLines` lines that fit `width`, adding "…" when
 * it is cut. Works per character, so Chinese/Japanese text wraps too; Latin
 * text prefers to break at spaces.
 */
export function wrapText(measure: (text: string) => number, text: string, width: number, maxLines: number): string[] {
  const chars = Array.from(text.replace(/\s+/g, " "));
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < chars.length; i++) {
    const next = line + chars[i];
    if (measure(next) <= width || line === "") {
      line = next;
      continue;
    }
    // Prefer breaking at the last space for Latin text.
    const space = line.lastIndexOf(" ");
    let carry = "";
    if (space > 0 && /[A-Za-z0-9]/.test(chars[i] ?? "")) {
      carry = line.slice(space + 1);
      line = line.slice(0, space);
    }
    lines.push(line.trimEnd());
    line = (carry + chars[i]).trimStart();
    if (lines.length === maxLines) {
      const rest = [line, ...chars.slice(i + 1)].join("");
      if (rest.trim()) lines[maxLines - 1] = ellipsize(measure, lines[maxLines - 1] ?? "", width);
      return lines;
    }
  }
  if (line) lines.push(line.trimEnd());
  return lines;
}

function ellipsize(measure: (text: string) => number, text: string, width: number): string {
  const chars = Array.from(text);
  while (chars.length && measure(chars.join("") + "…") > width) chars.pop();
  return chars.join("").trimEnd() + "…";
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  return wrapText((t) => ctx.measureText(t).width, text, width, maxLines);
}

function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  return wrap(ctx, text, width, 1)[0] ?? "";
}

function drawQr(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number): void {
  const matrix = qrMatrix(text, "M");
  const quiet = 4;
  const total = matrix.length + quiet * 2;
  // Whole, even pixels per module: edges stay sharp at full size and when an
  // app halves the image, which keeps the code scannable after compression.
  const cell = Math.max(2, Math.floor(size / total / 2) * 2);
  const offset = Math.floor((size - cell * total) / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#000000";
  const ox = Math.round(x) + offset + quiet * cell;
  const oy = Math.round(y) + offset + quiet * cell;
  matrix.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
    }),
  );
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Load an image for canvas use; resolves null if it fails or would taint the canvas. */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    const timer = setTimeout(() => resolve(null), 8000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

/** Mix a hex colour with white; non-hex colours fall back to a light grey. */
function tint(color: string, amount: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return "#f4f4f4";
  const mix = (i: number) => Math.round(255 - (255 - parseInt(hex.slice(i, i + 2), 16)) * amount);
  return `rgb(${mix(0)}, ${mix(2)}, ${mix(4)})`;
}
