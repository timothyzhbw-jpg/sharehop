import { isAllowedHref } from "./targets.js";
/**
 * Try to open an installed app by its URL scheme (e.g. "weixin://") and guess
 * whether it worked: if the page is hidden or loses focus within `timeout` ms,
 * the app (or the browser's "Open in …?" prompt) took over.
 *
 * Browsers give no direct answer, so treat "not-opened" as "probably not
 * installed or blocked" and always leave the user a manual fallback.
 * Call it from a click handler — browsers require a user gesture.
 */
export function launchApp(scheme, options = {}) {
    const doc = globalThis.document;
    const win = globalThis.window;
    if (!doc || !win)
        return Promise.resolve("unknown");
    if (!isAllowedHref(scheme))
        return Promise.resolve("not-opened");
    const timeout = options.timeout ?? 1600;
    return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            doc.removeEventListener("visibilitychange", onVisibility);
            win.removeEventListener("pagehide", onLeave);
            win.removeEventListener("blur", onLeave);
            resolve(result);
        };
        const onVisibility = () => {
            if (doc.visibilityState === "hidden")
                finish("opened");
        };
        const onLeave = () => finish("opened");
        doc.addEventListener("visibilitychange", onVisibility);
        win.addEventListener("pagehide", onLeave);
        win.addEventListener("blur", onLeave);
        const timer = setTimeout(() => finish(doc.visibilityState === "hidden" ? "opened" : "not-opened"), timeout);
        try {
            win.location.href = scheme;
        }
        catch {
            finish("not-opened");
        }
    });
}
