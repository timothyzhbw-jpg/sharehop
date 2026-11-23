/**
 * One place to hear about every share, from every widget on the page, in one
 * shape — ready to send to GA4, PostHog, a Supabase table or your own API.
 */
const TYPES = ["copy", "share", "qr", "download", "poster", "open", "close"];
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
export function onShareActivity(handler, options = {}) {
    const root = options.root ?? globalThis.document;
    if (!root)
        return () => { };
    const listeners = TYPES.map((type) => {
        const listener = (event) => {
            const detail = (event.detail ?? {});
            const el = event.target;
            const channel = String(detail.method ?? type);
            if (options.sharesOnly && !isShare(type, channel))
                return;
            try {
                handler({
                    type,
                    channel,
                    url: String(detail.url ?? ""),
                    ok: typeof detail.ok === "boolean" ? detail.ok : undefined,
                    result: typeof detail.result === "string" ? detail.result : undefined,
                    title: typeof detail.title === "string" ? detail.title : (el?.getAttribute?.("share-title") ?? undefined),
                    widgetId: el?.id || undefined,
                    timestamp: Date.now(),
                });
            }
            catch {
                // a failing analytics handler must never break sharing
            }
        };
        root.addEventListener(`sh-${type}`, listener);
        return () => root.removeEventListener(`sh-${type}`, listener);
    });
    return () => listeners.forEach((off) => off());
}
function isShare(type, channel) {
    if (type === "copy" || type === "share" || type === "download")
        return true;
    return type === "poster" && (channel === "poster-share" || channel === "poster-save");
}
/**
 * Share data read from the page's own tags: og:title / <title>,
 * og:description / meta description, og:image, og:url / canonical.
 * Useful when the page already has good Open Graph tags (as most do for
 * link previews in other apps).
 */
export function readPageMeta(doc = globalThis.document) {
    if (!doc)
        return {};
    const meta = (selector) => doc.querySelector(selector)?.content?.trim() || undefined;
    return {
        title: meta('meta[property="og:title"]') ?? meta('meta[name="twitter:title"]') ?? (doc.title.trim() || undefined),
        text: meta('meta[property="og:description"]') ?? meta('meta[name="description"]'),
        image: meta('meta[property="og:image"]') ?? meta('meta[name="twitter:image"]'),
        url: meta('meta[property="og:url"]') ?? doc.querySelector('link[rel="canonical"]')?.href,
        siteName: meta('meta[property="og:site_name"]'),
    };
}
