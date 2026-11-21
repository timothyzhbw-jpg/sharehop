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
export declare function launchApp(scheme: string, options?: {
    timeout?: number;
}): Promise<LaunchResult>;
