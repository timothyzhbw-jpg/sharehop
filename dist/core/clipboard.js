/**
 * Copy text to the clipboard. Uses the async Clipboard API when available and
 * falls back to a temporary textarea + execCommand("copy") for older browsers,
 * insecure (http) pages and in-app browsers that block the async API.
 * Must be called from a user gesture (click). Resolves to true on success.
 * `container`: see copyTextSync (needed inside an open modal dialog).
 */
export async function copyText(text, container) {
    const nav = globalThis.navigator;
    if (nav?.clipboard?.writeText && globalThis.isSecureContext !== false) {
        try {
            await nav.clipboard.writeText(text);
            return true;
        }
        catch {
            // fall through to the legacy path
        }
    }
    return copyTextSync(text, container);
}
/**
 * Copy synchronously, inside the click. Use it when the page is about to lose
 * focus right away — just before opening an app or a new tab — because the
 * async Clipboard API is refused once the document loses focus.
 *
 * `container` is where the temporary textarea goes. Pass a node that is not
 * inert — inside an open modal <dialog>, everything outside it is inert and
 * the copy would silently fail. Returns true only if a copy really happened.
 */
export function copyTextSync(text, container) {
    const doc = globalThis.document;
    if (!doc?.body || typeof doc.execCommand !== "function")
        return false;
    // Primary path: fill the clipboard from the copy event itself. This works
    // even when the textarea can't take focus or selection.
    let wrote = false;
    const onCopy = (event) => {
        const data = event.clipboardData;
        if (!data)
            return;
        data.setData("text/plain", text);
        event.preventDefault();
        wrote = true;
    };
    const previous = deepActiveElement(doc);
    const area = doc.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.setAttribute("aria-hidden", "true");
    area.tabIndex = -1;
    // Keep it out of view without display:none (which prevents selection) and
    // with a 16px font so iOS does not zoom the page.
    area.style.cssText =
        "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;";
    (container ?? doc.body).appendChild(area);
    area.focus({ preventScroll: true });
    area.select();
    area.setSelectionRange(0, text.length);
    const selected = area.getRootNode().activeElement === area;
    doc.addEventListener("copy", onCopy, true);
    let ok = false;
    try {
        ok = doc.execCommand("copy");
    }
    catch {
        ok = false;
    }
    doc.removeEventListener("copy", onCopy, true);
    area.remove();
    previous?.focus?.({ preventScroll: true });
    // execCommand can return true without copying anything (e.g. inert
    // textarea), so only trust it when the event fired or the text was selected.
    return ok && (wrote || selected);
}
/** The focused element, looking inside shadow roots. */
function deepActiveElement(doc) {
    let active = doc.activeElement;
    while (active?.shadowRoot?.activeElement)
        active = active.shadowRoot.activeElement;
    return active;
}
