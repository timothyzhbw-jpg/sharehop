export type LaunchResult = "opened" | "not-opened" | "unknown";

/**
 * Try to open an installed app by its URL scheme (e.g. "weixin://") and guess
 * whether it worked: if the page is hidden or loses focus within `timeout` ms,
 * the app (or the browser's "Open in …?" prompt) took over.
 *
 * Browsers give no direct answer, so treat "not-opened" as "probably not
 * installed or blocked" and always leave the user a manual fallback.
 * Call it from a click handler — browsers require a user gesture.
 */
export function launchApp(scheme: string, options: { timeout?: number } = {}): Promise<LaunchResult> {
  const doc = globalThis.document as Document | undefined;
  const win = globalThis.window as (Window & typeof globalThis) | undefined;
  if (!doc || !win) return Promise.resolve("unknown");
  const timeout = options.timeout ?? 1600;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: LaunchResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      doc.removeEventListener("visibilitychange", onVisibility);
      win.removeEventListener("pagehide", onLeave);
      win.removeEventListener("blur", onLeave);
      resolve(result);
    };
    const onVisibility = () => {
      if (doc.visibilityState === "hidden") finish("opened");
    };
    const onLeave = () => finish("opened");

    doc.addEventListener("visibilitychange", onVisibility);
    win.addEventListener("pagehide", onLeave);
    win.addEventListener("blur", onLeave);
    const timer = setTimeout(() => finish(doc.visibilityState === "hidden" ? "opened" : "not-opened"), timeout);

    try {
      win.location.href = scheme;
    } catch {
      finish("not-opened");
    }
  });
}
