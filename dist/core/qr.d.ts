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
export declare function qrMatrix(text: string, ecc?: QrErrorCorrection): boolean[][];
/**
 * Render a QR code as an SVG string. The SVG has a viewBox and no fixed size,
 * so it scales to whatever box it is placed in.
 */
export declare function qrSvg(text: string, options?: QrOptions): string;
/**
 * Draw a QR code onto a canvas and return it as a PNG Blob (browser only).
 * `scale` is the number of pixels per module; the default gives ~300–400px images.
 */
export declare function qrPngBlob(text: string, options?: QrOptions & {
    scale?: number;
}): Promise<Blob>;
