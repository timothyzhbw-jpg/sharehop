export interface ShareData {
    /** Absolute URL to share. */
    url: string;
    /** Short title, e.g. the listing or page name. */
    title?: string;
    /** One-line description, e.g. "$85 · pickup in New Brunswick". */
    text?: string;
}
/**
 * Combine title, description and link into one share message.
 *
 * Default output: "Title — description\nhttps://…" (empty parts are dropped).
 * A custom template may use {title}, {text} and {url}; lines that end up empty
 * are removed and surrounding whitespace is trimmed.
 */
export declare function composeShareText(data: ShareData, template?: string): string;
/**
 * The message without the link, for share APIs that take the URL separately
 * (navigator.share would otherwise show the link twice on some targets).
 */
export declare function composeShareTextWithoutUrl(data: ShareData, template?: string): string;
/**
 * Tag a URL with the channel it was shared through, so a site's existing
 * analytics can tell copy / QR / WhatsApp / native shares apart.
 * Adds utm_source=<channel>&utm_medium=share. Non-http(s) or invalid URLs are
 * returned unchanged; existing utm_source / utm_medium values are kept.
 */
export declare function withShareSource(url: string, channel: string): string;
/**
 * Resolve a possibly relative URL against a base (usually document.baseURI).
 * Returns null when the result is not an http(s) URL — such links are not
 * worth sharing and must never be put into an href.
 */
export declare function resolveShareUrl(url: string | null | undefined, base?: string): string | null;
