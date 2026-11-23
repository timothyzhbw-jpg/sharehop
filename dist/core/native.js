import { composeShareTextWithoutUrl } from "./text.js";
/** Whether the browser's native share sheet (Web Share API) can share this link. */
export function canNativeShare(data) {
    const nav = globalThis.navigator;
    if (!nav || typeof nav.share !== "function")
        return false;
    if (!data || typeof nav.canShare !== "function")
        return true;
    try {
        return nav.canShare(toNative(data));
    }
    catch {
        return false;
    }
}
/**
 * Open the native share sheet. Call it directly from a click handler — browsers
 * require a user gesture. A user closing the sheet resolves to "cancelled",
 * not an error. Callers should keep "copy link" as the fallback for
 * "unsupported" and "failed".
 */
export async function nativeShare(data, template) {
    const nav = globalThis.navigator;
    if (!nav || typeof nav.share !== "function")
        return "unsupported";
    try {
        await nav.share(toNative(data, template));
        return "shared";
    }
    catch (error) {
        // AbortError = the user closed the sheet. Anything else (NotAllowedError,
        // DataError, TypeError…) means the share did not happen.
        return error?.name === "AbortError" ? "cancelled" : "failed";
    }
}
function toNative(data, template) {
    const out = { url: data.url };
    if (data.title)
        out.title = data.title;
    const text = composeShareTextWithoutUrl(data, template);
    if (text)
        out.text = text;
    return out;
}
