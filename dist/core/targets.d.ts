import type { ShareData } from "./text.ts";
import { type ShareEnvironment } from "./env.ts";
import type { LaunchResult } from "./launch.ts";
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
export type AppScheme = string | {
    ios?: string;
    android?: string;
    desktop?: string;
    default?: string;
} | ((ctx: ShareContext) => string | null);
/**
 * A share destination — one button in the widget. Register your own with
 * `registerShareTarget()`; built-in ones (WhatsApp, Telegram, X, WeChat, …)
 * can be overridden the same way.
 */
export interface ShareTarget {
    /** Lowercase id used in the widget's `actions` attribute, e.g. "telegram". */
    id: string;
    /** Button text: one string, or per language ({ en: "Weibo", zh: "微博" }). */
    label: string | ({
        en: string;
    } & Record<string, string>);
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
export declare const RESERVED_IDS: readonly string[];
/** Be told when targets are registered or removed (widgets use this to re-render). */
export declare function onShareTargetsChange(listener: () => void): () => void;
/**
 * Add or replace a share target. Widgets already on the page update. Returns
 * a function that removes exactly this registration again.
 */
export declare function registerShareTarget(target: ShareTarget): () => void;
/** Remove a target (built-in or custom) entirely. Returns true if one was removed. */
export declare function unregisterShareTarget(id: string): boolean;
/** Look up a target by id or alias ("twitter" → "x"). */
export declare function getShareTarget(id: string): ShareTarget | undefined;
/** All registered targets, built-in first, in registration order. */
export declare function listShareTargets(): ShareTarget[];
export declare function validateTarget(target: ShareTarget): void;
/** Label in the requested language, falling back to English. */
export declare function targetLabel(target: ShareTarget, lang?: string): string;
export interface ShareContextOptions {
    template?: string;
    image?: string;
    env?: ShareEnvironment;
    lang?: string;
}
/** Build the context a target's href / onSelect receives. */
export declare function buildShareContext(data: ShareData & {
    image?: string;
}, options?: ShareContextOptions): ShareContext;
/** Fill a URL template: each {placeholder} is replaced by its URL-encoded value. */
export declare function fillTemplate(template: string, ctx: ShareContext): string;
/** The URL a target opens for this context, or null if it has none. */
export declare function resolveTargetHref(target: ShareTarget, ctx: ShareContext): string | null;
/** Make a URL absolute (relative ones against the page) and refuse dangerous schemes. */
export declare function safeHref(href: string | null | undefined): string | null;
/** The app URL to open on this platform (placeholders filled), if any. */
export declare function resolveAppScheme(app: AppScheme | undefined, ctx: ShareContext): string | null;
/** Whether the target should be shown in this environment. */
export declare function isTargetAvailable(target: ShareTarget, env: ShareEnvironment): boolean;
/**
 * Named groups of targets for the `actions` attribute, e.g.
 * actions="copy,qr,@china,native". Targets that can't work on the current
 * device are hidden automatically, so one preset fits phones and computers.
 */
export declare const PRESETS: Readonly<Record<string, readonly string[]>>;
/** Expand "@preset" tokens in an actions list. Unknown presets are dropped. */
export declare function expandActions(ids: readonly string[]): string[];
/** Whether a launch URL is an https link (opens a tab or a universal link) rather than a custom scheme. */
export declare function isWebUrl(url: string): boolean;
/**
 * Convenience for code without the widget: the share URL for a registered
 * target, e.g. shareTargetUrl("telegram", { url, title }).
 */
export declare function shareTargetUrl(id: string, data: ShareData & {
    image?: string;
}, template?: string): string | null;
/** Block script-capable schemes in anything a target hands us. */
export declare function isAllowedHref(href: string): boolean;
