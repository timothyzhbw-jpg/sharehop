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
export function composeShareText(data: ShareData, template?: string): string {
  const title = clean(data.title);
  const text = clean(data.text);
  const url = clean(data.url);

  if (!template) {
    const head = [title, text].filter(Boolean).join(" — ");
    return [head, url].filter(Boolean).join("\n");
  }

  return template
    .replace(/\{(title|text|url)\}/g, (_, key: string) =>
      key === "title" ? title : key === "text" ? text : url,
    )
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .join("\n");
}

/**
 * The message without the link, for share APIs that take the URL separately
 * (navigator.share would otherwise show the link twice on some targets).
 */
export function composeShareTextWithoutUrl(data: ShareData, template?: string): string {
  return composeShareText({ ...data, url: "" }, template);
}

/**
 * Tag a URL with the channel it was shared through, so a site's existing
 * analytics can tell copy / QR / WhatsApp / native shares apart.
 * Adds utm_source=<channel>&utm_medium=share. Non-http(s) or invalid URLs are
 * returned unchanged; existing utm_source / utm_medium values are kept.
 */
export function withShareSource(url: string, channel: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return url;
  if (!parsed.searchParams.has("utm_source")) parsed.searchParams.set("utm_source", channel);
  if (!parsed.searchParams.has("utm_medium")) parsed.searchParams.set("utm_medium", "share");
  return parsed.toString();
}

/**
 * Resolve a possibly relative URL against a base (usually document.baseURI).
 * Returns null when the result is not an http(s) URL — such links are not
 * worth sharing and must never be put into an href.
 */
export function resolveShareUrl(url: string | null | undefined, base?: string): string | null {
  if (!url) return base && isHttp(base) ? base : null;
  try {
    const resolved = new URL(url, base);
    return isHttp(resolved.href) ? resolved.href : null;
  } catch {
    return null;
  }
}

function isHttp(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
