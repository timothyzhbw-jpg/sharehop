/**
 * One place to hear about every share, from every widget on the page, in one
 * shape — ready to send to GA4, PostHog, a Supabase table or your own API.
 */

export type ShareActivityType = "copy" | "share" | "qr" | "download" | "poster" | "open" | "close";

export interface ShareActivity {
  type: ShareActivityType;
  /** What was used: "copy-link", "copy-button", "native", "poster-share", or an app id such as "wechat". */
  channel: string;
  /** The link that was shared (with UTM tags if enabled). */
  url: string;
  ok?: boolean;
  result?: string;
  /** The widget's share-title. */
  title?: string;
  /** The widget element's id, if it has one (useful when a page has several). */
  widgetId?: string;
  /** Milliseconds since epoch. */
  timestamp: number;
}

const TYPES: readonly ShareActivityType[] = ["copy", "share", "qr", "download", "poster", "open", "close"];

/**
 * Call `handler` for every share event from any sharehop widget under `root`
 * (default: the whole document). Returns a function that stops listening.
 *
 *   onShareActivity((e) => gtag("event", "share", { method: e.channel, item_id: e.url }));
 */
export function onShareActivity(
  handler: (activity: ShareActivity) => void,
  options: { root?: EventTarget } = {},
): () => void {
  const root = options.root ?? (globalThis.document as Document | undefined);
  if (!root) return () => {};
  const listeners = TYPES.map((type) => {
    const listener = (event: Event) => {
      const detail = ((event as CustomEvent).detail ?? {}) as Record<string, unknown>;
      const el = event.target as Element | null;
      try {
        handler({
          type,
          channel: String(detail.method ?? type),
          url: String(detail.url ?? ""),
          ok: typeof detail.ok === "boolean" ? detail.ok : undefined,
          result: typeof detail.result === "string" ? detail.result : undefined,
          title: el?.getAttribute?.("share-title") ?? undefined,
          widgetId: el?.id || undefined,
          timestamp: Date.now(),
        });
      } catch {
        // a failing analytics handler must never break sharing
      }
    };
    root.addEventListener(`sh-${type}`, listener);
    return () => root.removeEventListener(`sh-${type}`, listener);
  });
  return () => listeners.forEach((off) => off());
}

/**
 * Share data read from the page's own tags: og:title / <title>,
 * og:description / meta description, og:image, og:url / canonical.
 * Useful when the page already has good Open Graph tags (as most do for
 * link previews in other apps).
 */
export function readPageMeta(doc: Document | undefined = globalThis.document): {
  title?: string;
  text?: string;
  image?: string;
  url?: string;
  siteName?: string;
} {
  if (!doc) return {};
  const meta = (selector: string) => doc.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined;
  return {
    title: meta('meta[property="og:title"]') ?? meta('meta[name="twitter:title"]') ?? (doc.title.trim() || undefined),
    text: meta('meta[property="og:description"]') ?? meta('meta[name="description"]'),
    image: meta('meta[property="og:image"]') ?? meta('meta[name="twitter:image"]'),
    url: meta('meta[property="og:url"]') ?? doc.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    siteName: meta('meta[property="og:site_name"]'),
  };
}
