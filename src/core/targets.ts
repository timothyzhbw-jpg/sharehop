import type { ShareData } from "./text.ts";
import { composeShareText, composeShareTextWithoutUrl } from "./text.ts";
import { detectEnv, type ShareEnvironment } from "./env.ts";
import type { LaunchResult } from "./launch.ts";
import { BUILTIN_TARGETS } from "./builtin-targets.ts";

/** Everything a share target can use to build its link. All strings, never undefined. */
export interface ShareContext {
  /** The link to share (already tagged with utm_source when the widget's `utm` is on). */
  url: string;
  title: string;
  text: string;
  /** Full message: "title — text" + newline + url, or the widget's template. */
  message: string;
  /** The message without the link: "title — text". */
  summary: string;
  /** Optional image URL (the widget's `image` attribute). */
  image: string;
  /** Host of the shared link, e.g. "example.com" (some services want the source site). */
  host: string;
  /** Detected browser environment. */
  env: ShareEnvironment;
  /** Language of the widget ("en", "zh", …). */
  lang: string;
}

/** Helpers handed to a target's `onSelect`. */
export interface ShareTools {
  /** Copy text to the clipboard. */
  copy(text: string): Promise<boolean>;
  /** Open a URL (new tab by default for http(s)). */
  open(url: string, newTab?: boolean): void;
  /** Try to open an installed app by URL scheme; resolves "opened" / "not-opened" / "unknown". */
  launchApp(scheme: string): Promise<LaunchResult>;
  /** Show (and announce) a short message under the panel. */
  status(message: string, visible?: boolean): void;
  /** Open the widget's QR code view. */
  openQr(): void;
  /** Full-screen hint with an arrow to the top-right menu (for in-app browsers such as WeChat). */
  pointToMenu(message: string): void;
}

/**
 * How to open an app: one URL for every platform, or one per platform. A
 * custom scheme ("weixin://"), an Android intent URL, or an https universal
 * link. Placeholders such as {url} are filled in like `href`.
 */
export type AppScheme =
  | string
  | { ios?: string; android?: string; desktop?: string; default?: string }
  | ((ctx: ShareContext) => string | null);

/**
 * A share destination — one button in the widget. Register your own with
 * `registerShareTarget()`; built-in ones (WhatsApp, Telegram, X, WeChat, …)
 * can be overridden the same way.
 */
export interface ShareTarget {
  /** Lowercase id used in the widget's `actions` attribute, e.g. "telegram". */
  id: string;
  /** Button text: one string, or per language ({ en: "Weibo", zh: "微博" }). */
  label: string | ({ en: string } & Record<string, string>);
  /** SVG markup for the icon (24×24 viewBox, drawn with currentColor). Built-ins get theirs from the widget. */
  icon?: string;
  /** Brand colour, used when the widget has `brand-colors`. */
  color?: string;
  /**
   * Where to go. A template string with {url} {title} {text} {message}
   * {summary} {image} placeholders (each is URL-encoded), or a function that
   * returns the URL — or null to do nothing.
   */
  href?: string | ((ctx: ShareContext) => string | null);
  /** Open the link in a new tab. Default: true for http(s) links, false for other schemes. */
  newTab?: boolean;
  /**
   * For apps whose share box can't be pre-filled from the web: copy first
   * ("link" or "message"), then launch `app` so the user can paste.
   */
  copy?: "link" | "message";
  /** App to launch after copying, by URL scheme — one for all platforms or per OS. */
  app?: AppScheme;
  /**
   * On computers, copy the link and show the widget's QR code with "scan with
   * {app}" instead of launching anything (for phone-first apps like WeChat).
   */
  desktop?: "qr";
  /**
   * Return true when the page is open inside this app's own browser (e.g.
   * WeChat): the widget then points to the app's ··· menu instead.
   */
  insideApp?: (env: ShareEnvironment) => boolean;
  /** Fully custom click handling; when set, href / copy / app are ignored. */
  onSelect?: (ctx: ShareContext, tools: ShareTools) => void | Promise<void>;
  /** Only show on phones/tablets or only on computers. Default: both. */
  platforms?: "mobile" | "desktop";
  /** Return false to hide the button in an environment where it can't work. */
  available?: (env: ShareEnvironment) => boolean;
}

/** Ids the widget uses for its own buttons; targets can't take them. */
export const RESERVED_IDS: readonly string[] = ["copy", "qr", "native", "more"];

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

// Built-ins form the base layer; each registerShareTarget() call stacks a layer
// on top for its id, so undoing one registration never resurrects another.
const base = new Map<string, ShareTarget>(BUILTIN_TARGETS.map((t) => [t.id, t]));
const layers = new Map<string, ShareTarget[]>();
const registry = {
  get(id: string): ShareTarget | undefined {
    return layers.get(id)?.at(-1) ?? base.get(id);
  },
  ids(): string[] {
    return [...new Set([...base.keys(), ...layers.keys()])];
  },
};
const aliases = new Map<string, string>([
  ["twitter", "x"],
  ["mail", "email"],
  ["text", "sms"],
  ["weixin", "wechat"],
  ["sinaweibo", "weibo"],
  ["rednote", "xiaohongshu"],
  ["xhs", "xiaohongshu"],
  ["fb", "facebook"],
]);

const listeners = new Set<() => void>();

/** Be told when targets are registered or removed (widgets use this to re-render). */
export function onShareTargetsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function changed(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
      // a broken listener must not stop the others
    }
  }
}

/**
 * Add or replace a share target. Widgets already on the page update. Returns
 * a function that removes exactly this registration again.
 */
export function registerShareTarget(target: ShareTarget): () => void {
  validateTarget(target);
  const stored = { ...target };
  const stack = layers.get(target.id) ?? [];
  stack.push(stored);
  layers.set(target.id, stack);
  changed();
  return () => {
    const current = layers.get(target.id);
    const index = current?.indexOf(stored) ?? -1;
    if (!current || index < 0) return;
    current.splice(index, 1);
    if (!current.length) layers.delete(target.id);
    changed();
  };
}

/** Remove a target (built-in or custom) entirely. Returns true if one was removed. */
export function unregisterShareTarget(id: string): boolean {
  const removed = layers.delete(id) || base.has(id);
  base.delete(id);
  if (removed) changed();
  return removed;
}

/** Look up a target by id or alias ("twitter" → "x"). */
export function getShareTarget(id: string): ShareTarget | undefined {
  const key = id.trim().toLowerCase();
  return registry.get(key) ?? registry.get(aliases.get(key) ?? "");
}

/** All registered targets, built-in first, in registration order. */
export function listShareTargets(): ShareTarget[] {
  return registry.ids().map((id) => registry.get(id)).filter((t): t is ShareTarget => !!t);
}

export function validateTarget(target: ShareTarget): void {
  if (!target || typeof target !== "object") throw new TypeError("Share target must be an object");
  if (!ID_PATTERN.test(target.id ?? ""))
    throw new TypeError(`Share target id "${target.id}" must be lowercase letters, digits or dashes`);
  if (RESERVED_IDS.includes(target.id)) throw new TypeError(`Share target id "${target.id}" is reserved`);
  const label = target.label;
  if (!(typeof label === "string" ? label : label?.en)) throw new TypeError(`Share target "${target.id}" needs a label`);
  if (!target.href && !target.onSelect && !target.copy && !target.app)
    throw new TypeError(`Share target "${target.id}" needs href, onSelect, copy or app`);
}

/** Label in the requested language, falling back to English. */
export function targetLabel(target: ShareTarget, lang = "en"): string {
  if (typeof target.label === "string") return target.label;
  const base = lang.toLowerCase().split("-")[0] ?? "en";
  return target.label[lang] ?? target.label[base] ?? target.label.en;
}

export interface ShareContextOptions {
  template?: string;
  image?: string;
  env?: ShareEnvironment;
  lang?: string;
}

/** Build the context a target's href / onSelect receives. */
export function buildShareContext(data: ShareData & { image?: string }, options: ShareContextOptions = {}): ShareContext {
  return {
    url: data.url,
    title: (data.title ?? "").trim(),
    text: (data.text ?? "").trim(),
    message: composeShareText(data, options.template),
    summary: composeShareTextWithoutUrl(data, options.template),
    image: options.image ?? data.image ?? "",
    host: hostOf(data.url),
    env: options.env ?? detectEnv(),
    lang: options.lang ?? "en",
  };
}

/** Fill a URL template: each {placeholder} is replaced by its URL-encoded value. */
export function fillTemplate(template: string, ctx: ShareContext): string {
  return template.replace(/\{(url|title|text|message|summary|image|host)\}/g, (_, key: keyof ShareContext) =>
    encodeURIComponent(String(ctx[key] ?? "")),
  );
}

/** The URL a target opens for this context, or null if it has none. */
export function resolveTargetHref(target: ShareTarget, ctx: ShareContext): string | null {
  if (!target.href) return null;
  const href = typeof target.href === "string" ? fillTemplate(target.href, ctx) : target.href(ctx);
  return href && isAllowedHref(href) ? href : null;
}

/** The app URL to open on this platform (placeholders filled), if any. */
export function resolveAppScheme(app: AppScheme | undefined, ctx: ShareContext): string | null {
  if (!app) return null;
  const { env } = ctx;
  let scheme: string | null | undefined;
  if (typeof app === "function") scheme = app(ctx);
  else {
    const pick =
      typeof app === "string"
        ? app
        : ((env.ios ? app.ios : env.android ? app.android : env.mobile ? undefined : app.desktop) ?? app.default);
    scheme = pick ? fillTemplate(pick, ctx) : null;
  }
  return scheme && isAllowedHref(scheme) ? scheme : null;
}

/** Whether the target should be shown in this environment. */
export function isTargetAvailable(target: ShareTarget, env: ShareEnvironment): boolean {
  if (target.platforms === "mobile" && !env.mobile) return false;
  if (target.platforms === "desktop" && env.mobile) return false;
  try {
    return target.available ? target.available(env) !== false : true;
  } catch {
    return false;
  }
}

/**
 * Named groups of targets for the `actions` attribute, e.g.
 * actions="copy,qr,@china,native". Targets that can't work on the current
 * device are hidden automatically, so one preset fits phones and computers.
 */
export const PRESETS: Readonly<Record<string, readonly string[]>> = {
  // Chat apps international students use most (order matters).
  messaging: ["sms", "whatsapp", "instagram", "wechat", "snapchat", "kakaotalk", "line", "telegram", "email"],
  // Mainland China (services blocked there are left out).
  china: ["wechat", "qq", "weibo", "xiaohongshu", "qzone", "douyin", "douban", "email"],
  social: ["x", "facebook", "linkedin", "reddit", "threads", "bluesky"],
  school: ["googleclassroom", "teams", "gmail", "outlook", "groupme", "discord", "slack"],
  korea: ["kakaotalk", "band", "naver", "line"],
  japan: ["line", "x", "hatena"],
};

/** Expand "@preset" tokens in an actions list. Unknown presets are dropped. */
export function expandActions(ids: readonly string[]): string[] {
  return ids.flatMap((id) => (id.startsWith("@") ? [...(PRESETS[id.slice(1).toLowerCase()] ?? [])] : [id]));
}

/** Whether a launch URL is an https link (opens a tab or a universal link) rather than a custom scheme. */
export function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Convenience for code without the widget: the share URL for a registered
 * target, e.g. shareTargetUrl("telegram", { url, title }).
 */
export function shareTargetUrl(id: string, data: ShareData & { image?: string }, template?: string): string | null {
  const target = getShareTarget(id);
  return target ? resolveTargetHref(target, buildShareContext(data, { template })) : null;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

/** Block script-capable schemes in anything a target hands us. */
export function isAllowedHref(href: string): boolean {
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(href.trim())?.[1]?.toLowerCase();
  if (!scheme) return false;
  return !["javascript", "data", "vbscript", "file", "blob", "about"].includes(scheme);
}
