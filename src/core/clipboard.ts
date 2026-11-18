/**
 * Copy text to the clipboard. Uses the async Clipboard API when available and
 * falls back to a temporary textarea + execCommand("copy") for older browsers,
 * insecure (http) pages and in-app browsers that block the async API.
 * Must be called from a user gesture (click). Resolves to true on success.
 */
export async function copyText(text: string): Promise<boolean> {
  const nav = globalThis.navigator as Navigator | undefined;
  if (nav?.clipboard?.writeText && globalThis.isSecureContext !== false) {
    try {
      await nav.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const doc = globalThis.document as Document | undefined;
  if (!doc?.body || typeof doc.execCommand !== "function") return false;

  const area = doc.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  // Keep it out of view without display:none (which prevents selection) and
  // with a 16px font so iOS does not zoom the page.
  area.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;";
  doc.body.appendChild(area);

  const previous = doc.activeElement as HTMLElement | null;
  area.focus();
  area.select();
  area.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = doc.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  previous?.focus?.();
  return ok;
}
