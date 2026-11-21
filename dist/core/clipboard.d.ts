/**
 * Copy text to the clipboard. Uses the async Clipboard API when available and
 * falls back to a temporary textarea + execCommand("copy") for older browsers,
 * insecure (http) pages and in-app browsers that block the async API.
 * Must be called from a user gesture (click). Resolves to true on success.
 * `container`: see copyTextSync (needed inside an open modal dialog).
 */
export declare function copyText(text: string, container?: Node): Promise<boolean>;
/**
 * Copy synchronously, inside the click. Use it when the page is about to lose
 * focus right away — just before opening an app or a new tab — because the
 * async Clipboard API is refused once the document loses focus.
 *
 * `container` is where the temporary textarea goes. Pass a node that is not
 * inert — inside an open modal <dialog>, everything outside it is inert and
 * the copy would silently fail. Returns true only if a copy really happened.
 */
export declare function copyTextSync(text: string, container?: Node): boolean;
