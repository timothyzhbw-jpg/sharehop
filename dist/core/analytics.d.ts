/**
 * One place to hear about every share, from every widget on the page, in one
 * shape — ready to send to GA4, PostHog, a Supabase table or your own API.
 */
export type ShareActivityType = "copy" | "share" | "qr" | "download" | "poster" | "open" | "close";
export interface ShareActivity {
    type: ShareActivityType;
    /** What was used: "copy-link", "copy-button", "native", "poster-share", or an app id such as "wechat". */
    channel: string;
    /** The link that was shared (with UTM tags if enabled); for QR and share-image events, what the QR encodes. */
    url: string;
    ok?: boolean;
    result?: string;
    /** The share title (share-title, or the page's og:title with page-meta). */
    title?: string;
    /** The widget element's id, if it has one (useful when a page has several). */
    widgetId?: string;
    /** Milliseconds since epoch. */
    timestamp: number;
}
/**
 * Call `handler` for every share event from any sharehop widget under `root`
 * (default: the whole document). Returns a function that stops listening.
 *
 *   onShareActivity((e) => gtag("event", "share", { method: e.channel, item_id: e.url }), { sharesOnly: true });
 *
 * By default it also reports opening/closing the dialog and the QR/poster
 * panels; `sharesOnly: true` keeps just copies, app and native shares, QR
 * downloads and share-image shares/saves.
 */
export declare function onShareActivity(handler: (activity: ShareActivity) => void, options?: {
    root?: EventTarget;
    sharesOnly?: boolean;
}): () => void;
/**
 * Share data read from the page's own tags: og:title / <title>,
 * og:description / meta description, og:image, og:url / canonical.
 * Useful when the page already has good Open Graph tags (as most do for
 * link previews in other apps).
 */
export declare function readPageMeta(doc?: Document | undefined): {
    title?: string;
    text?: string;
    image?: string;
    url?: string;
    siteName?: string;
};
