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
/** Draw a poster onto a new canvas (browser only). */
export declare function posterCanvas(options: PosterOptions): Promise<HTMLCanvasElement>;
/** Render the poster as a PNG Blob (browser only). */
export declare function posterBlob(options: PosterOptions): Promise<Blob>;
/**
 * Break text into at most `maxLines` lines that fit `width`, adding "…" when
 * it is cut. Works per character, so Chinese/Japanese text wraps too; Latin
 * text prefers to break at spaces.
 */
export declare function wrapText(measure: (text: string) => number, text: string, width: number, maxLines: number): string[];
