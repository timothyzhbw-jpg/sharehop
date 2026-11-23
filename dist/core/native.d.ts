import type { ShareData } from "./text.ts";
export type NativeShareResult = "shared" | "cancelled" | "unsupported" | "failed";
/** Whether the browser's native share sheet (Web Share API) can share this link. */
export declare function canNativeShare(data?: ShareData): boolean;
/**
 * Open the native share sheet. Call it directly from a click handler — browsers
 * require a user gesture. A user closing the sheet resolves to "cancelled",
 * not an error. Callers should keep "copy link" as the fallback for
 * "unsupported" and "failed".
 */
export declare function nativeShare(data: ShareData, template?: string): Promise<NativeShareResult>;
