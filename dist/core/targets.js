import { composeShareText, composeShareTextWithoutUrl } from "./text.js";
import { detectEnv } from "./env.js";
import { BUILTIN_TARGETS } from "./builtin-targets.js";
/** Ids the widget uses for its own buttons; targets can't take them. */
export const RESERVED_IDS = ["copy", "qr", "native", "more"];
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
// Built-ins form the base layer; each registerShareTarget() call stacks a layer
// on top for its id, so undoing one registration never resurrects another.
const base = new Map(BUILTIN_TARGETS.map((t) => [t.id, t]));
const layers = new Map();
const registry = {
    get(id) {
        return layers.get(id)?.at(-1) ?? base.get(id);
    },
    ids() {
        return [...new Set([...base.keys(), ...layers.keys()])];
    },
};
const aliases = new Map([
    ["twitter", "x"],
    ["mail", "email"],
    ["text", "sms"],
    ["weixin", "wechat"],
    ["sinaweibo", "weibo"],
    ["rednote", "xiaohongshu"],
    ["xhs", "xiaohongshu"],
    ["fb", "facebook"],
]);
const listeners = new Set();
/** Be told when targets are registered or removed (widgets use this to re-render). */
export function onShareTargetsChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
function changed() {
    for (const listener of [...listeners]) {
        try {
            listener();
        }
        catch {
            // a broken listener must not stop the others
        }
    }
}
/**
 * Add or replace a share target. Widgets already on the page update. Returns
 * a function that removes exactly this registration again.
 */
export function registerShareTarget(target) {
    validateTarget(target);
    const stored = { ...target };
    const stack = layers.get(target.id) ?? [];
    stack.push(stored);
    layers.set(target.id, stack);
    changed();
    return () => {
        const current = layers.get(target.id);
        const index = current?.indexOf(stored) ?? -1;
        if (!current || index < 0)
            return;
        current.splice(index, 1);
        if (!current.length)
            layers.delete(target.id);
        changed();
    };
}
/** Remove a target (built-in or custom) entirely. Returns true if one was removed. */
export function unregisterShareTarget(id) {
    const removed = layers.delete(id) || base.has(id);
    base.delete(id);
    if (removed)
        changed();
    return removed;
}
/** Look up a target by id or alias ("twitter" → "x"). */
export function getShareTarget(id) {
    const key = id.trim().toLowerCase();
    return registry.get(key) ?? registry.get(aliases.get(key) ?? "");
}
/** All registered targets, built-in first, in registration order. */
export function listShareTargets() {
    return registry.ids().map((id) => registry.get(id)).filter((t) => !!t);
}
export function validateTarget(target) {
    if (!target || typeof target !== "object")
        throw new TypeError("Share target must be an object");
    if (!ID_PATTERN.test(target.id ?? ""))
        throw new TypeError(`Share target id "${target.id}" must be lowercase letters, digits or dashes`);
    if (RESERVED_IDS.includes(target.id))
        throw new TypeError(`Share target id "${target.id}" is reserved`);
    const label = target.label;
    if (!(typeof label === "string" ? label : label?.en))
        throw new TypeError(`Share target "${target.id}" needs a label`);
    if (!target.href && !target.onSelect && !target.copy && !target.app)
        throw new TypeError(`Share target "${target.id}" needs href, onSelect, copy or app`);
}
/** Label in the requested language, falling back to English. */
export function targetLabel(target, lang = "en") {
    if (typeof target.label === "string")
        return target.label;
    const base = lang.toLowerCase().split("-")[0] ?? "en";
    return target.label[lang] ?? target.label[base] ?? target.label.en;
}
/** Build the context a target's href / onSelect receives. */
export function buildShareContext(data, options = {}) {
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
export function fillTemplate(template, ctx) {
    return template.replace(/\{(url|title|text|message|summary|image|host)\}/g, (_, key) => encodeURIComponent(String(ctx[key] ?? "")));
}
/** The URL a target opens for this context, or null if it has none. */
export function resolveTargetHref(target, ctx) {
    if (!target.href)
        return null;
    let href;
    try {
        href = typeof target.href === "string" ? fillTemplate(target.href, ctx) : target.href(ctx);
    }
    catch {
        return null; // one broken target must not break the widget
    }
    return safeHref(href);
}
/** Make a URL absolute (relative ones against the page) and refuse dangerous schemes. */
export function safeHref(href) {
    if (!href)
        return null;
    const trimmed = href.trim();
    if (isAllowedHref(trimmed))
        return trimmed;
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed))
        return null; // a scheme we refuse
    const base = globalThis.document?.baseURI;
    if (!base)
        return null;
    try {
        const absolute = new URL(trimmed, base).href;
        return isAllowedHref(absolute) ? absolute : null;
    }
    catch {
        return null;
    }
}
/** The app URL to open on this platform (placeholders filled), if any. */
export function resolveAppScheme(app, ctx) {
    if (!app)
        return null;
    const { env } = ctx;
    let scheme;
    try {
        if (typeof app === "function")
            scheme = app(ctx);
        else {
            const pick = typeof app === "string"
                ? app
                : ((env.ios ? app.ios : env.android ? app.android : env.mobile ? undefined : app.desktop) ?? app.default);
            scheme = pick ? fillTemplate(pick, ctx) : null;
        }
    }
    catch {
        return null;
    }
    return safeHref(scheme);
}
/** Whether the target should be shown in this environment. */
export function isTargetAvailable(target, env) {
    if (target.platforms === "mobile" && !env.mobile)
        return false;
    if (target.platforms === "desktop" && env.mobile)
        return false;
    try {
        return target.available ? target.available(env) !== false : true;
    }
    catch {
        return false;
    }
}
/**
 * Named groups of targets for the `actions` attribute, e.g.
 * actions="copy,qr,@china,native". Targets that can't work on the current
 * device are hidden automatically, so one preset fits phones and computers.
 */
export const PRESETS = {
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
export function expandActions(ids) {
    return ids.flatMap((id) => (id.startsWith("@") ? [...(PRESETS[id.slice(1).toLowerCase()] ?? [])] : [id]));
}
/** Whether a launch URL is an https link (opens a tab or a universal link) rather than a custom scheme. */
export function isWebUrl(url) {
    return /^https?:\/\//i.test(url);
}
/**
 * Convenience for code without the widget: the share URL for a registered
 * target, e.g. shareTargetUrl("telegram", { url, title }).
 */
export function shareTargetUrl(id, data, template) {
    const target = getShareTarget(id);
    return target ? resolveTargetHref(target, buildShareContext(data, { template })) : null;
}
function hostOf(url) {
    try {
        return new URL(url).host;
    }
    catch {
        return "";
    }
}
/** Block script-capable schemes in anything a target hands us. */
export function isAllowedHref(href) {
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(href.trim())?.[1]?.toLowerCase();
    if (!scheme)
        return false;
    return !["javascript", "data", "vbscript", "file", "blob", "about"].includes(scheme);
}
