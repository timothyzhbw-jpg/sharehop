import { resolveShareUrl, withShareSource } from "../core/text.js";
import { copyText, copyTextSync } from "../core/clipboard.js";
import { canNativeShare, nativeShare } from "../core/native.js";
import { buildShareContext, expandActions, getShareTarget, onShareTargetsChange, isAllowedHref, isTargetAvailable, isWebUrl, resolveAppScheme, resolveTargetHref, targetLabel, validateTarget, } from "../core/targets.js";
import { launchApp } from "../core/launch.js";
import { detectEnv } from "../core/env.js";
import { qrPngBlob, qrSvg } from "../core/qr.js";
import { LABELS, resolveLang } from "./labels.js";
import { icons, monogram } from "./icons.js";
import { brandIcon } from "./brand-icons.js";
import { styles } from "./styles.js";
export const DEFAULT_ACTIONS = ["copy", "qr", "whatsapp", "native"];
// Lets the module be imported during server rendering, where HTMLElement does not exist.
const Base = (typeof HTMLElement === "undefined" ? class {
} : HTMLElement);
let instances = 0;
export class ShareHopElement extends Base {
    static observedAttributes = [
        "url",
        "share-title",
        "share-text",
        "template",
        "heading",
        "actions",
        "mode",
        "lang",
        "utm",
        "closable",
        "brand-colors",
        "image",
        "preview-title",
        "preview-subtitle",
        "preview-meta",
    ];
    #root;
    #id = `sh${++instances}`;
    #labels = {};
    #targets = new Map();
    #env = null;
    #qrOpen = false;
    #timers = new Map();
    #unsubscribe = null;
    #renderQueued = false;
    /** Targets as rendered, by data-target id — clicks run exactly what was shown. */
    #rendered = new Map();
    /** Set while #render() replaces the markup, so the old dialog's close isn't reported. */
    #rerendering = false;
    /** Element that opened the full-screen hint, to refocus when it closes. */
    #hintOpener = null;
    constructor() {
        super();
        this.#root = this.attachShadow({ mode: "open" });
        this.#root.addEventListener("click", (event) => this.#onClick(event));
    }
    /** Override any built-in text, e.g. `el.labels = { heading: "Share this listing" }`. */
    get labels() {
        return { ...this.#labels };
    }
    set labels(value) {
        this.#labels = { ...(value ?? {}) };
        if (this.isConnected)
            this.#render();
    }
    /**
     * Share targets for this widget only (they win over registered ones with the
     * same id). List their ids in `actions` to show them.
     */
    get targets() {
        return [...this.#targets.values()];
    }
    set targets(value) {
        const next = new Map();
        for (const target of value ?? []) {
            validateTarget(target);
            next.set(target.id, target);
        }
        const same = next.size === this.#targets.size && [...next].every(([id, target]) => this.#targets.get(id) === target);
        this.#targets = next;
        if (!same && this.isConnected)
            this.#render();
    }
    /** Open the panel (button mode) — e.g. from your own Share button. */
    open() {
        const dialog = this.#root.querySelector("dialog:not(.wx-hint)");
        if (dialog && !dialog.open) {
            dialog.showModal();
            this.#emit("sh-open", { method: "dialog" });
        }
    }
    /** Close the panel (button mode) or hide it (panel mode). */
    close() {
        const dialog = this.#root.querySelector("dialog:not(.wx-hint)");
        if (dialog) {
            dialog.close();
            return;
        }
        if (this.#emit("sh-close", { method: "panel" }, true))
            this.hidden = true;
    }
    connectedCallback() {
        this.#env ??= detectEnv();
        // Targets registered after this widget rendered (e.g. by a later script) show up too.
        this.#unsubscribe ??= onShareTargetsChange(() => this.#queueRender());
        this.#render();
    }
    disconnectedCallback() {
        this.#unsubscribe?.();
        this.#unsubscribe = null;
        for (const timer of this.#timers.values())
            clearTimeout(timer);
        this.#timers.clear();
    }
    /** Re-render once after a burst of registry changes. */
    #queueRender() {
        if (this.#renderQueued)
            return;
        this.#renderQueued = true;
        queueMicrotask(() => {
            this.#renderQueued = false;
            if (this.isConnected)
                this.#render();
        });
    }
    attributeChangedCallback(_name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected)
            this.#render();
    }
    // ---- data ---------------------------------------------------------------
    #rawLang() {
        return this.getAttribute("lang") || this.closest("[lang]")?.getAttribute("lang") || "en";
    }
    #strings() {
        return { ...LABELS[resolveLang(this.#rawLang())], ...this.#labels };
    }
    #data() {
        const base = globalThis.document?.baseURI;
        const url = resolveShareUrl(this.getAttribute("url"), base);
        if (!url)
            return null;
        return {
            url,
            title: this.getAttribute("share-title") ?? undefined,
            text: this.getAttribute("share-text") ?? undefined,
        };
    }
    /** The link for a channel, tagged with utm_source when the `utm` attribute is set. */
    #urlFor(channel, url) {
        return this.hasAttribute("utm") ? withShareSource(url, channel) : url;
    }
    #template() {
        return this.getAttribute("template") ?? undefined;
    }
    /** Widget-local targets first (by id, then by the alias's canonical id), then the registry. */
    #lookup(id) {
        const canonical = getShareTarget(id)?.id;
        return this.#targets.get(id) ?? (canonical ? this.#targets.get(canonical) : undefined) ?? getShareTarget(id);
    }
    #context(target, data) {
        return buildShareContext({ ...data, url: this.#urlFor(target.id, data.url) }, {
            template: this.#template(),
            // Only absolute http(s) images are useful to share services (not data:/blob:).
            image: httpImage(safeImage(this.getAttribute("image"))),
            env: this.#env ?? detectEnv(),
            lang: this.#rawLang(),
        });
    }
    #items(data) {
        const env = this.#env ?? detectEnv();
        const raw = this.getAttribute("actions");
        const ids = expandActions(raw ? raw.split(/[\s,]+/).filter(Boolean) : [...DEFAULT_ACTIONS]);
        const seen = new Set();
        const items = [];
        for (const rawId of ids) {
            const id = rawId.toLowerCase() === "more" ? "native" : rawId.toLowerCase();
            if (id === "copy" || id === "qr" || id === "native") {
                // "More" is only useful where a native share sheet exists — or in
                // WeChat, where it explains WeChat's own share menu instead.
                if (id === "native" && !env.wechat && !canNativeShare(data))
                    continue;
                if (!seen.has(id))
                    items.push({ kind: "builtin", id });
                seen.add(id);
                continue;
            }
            const target = this.#lookup(id);
            if (!target || seen.has(target.id) || !isTargetAvailable(target, env))
                continue;
            seen.add(target.id);
            items.push({ kind: "target", id: target.id, target });
        }
        return items;
    }
    // ---- rendering ------------------------------------------------------------
    #render() {
        const L = this.#strings();
        const data = this.#data();
        const isButton = this.getAttribute("mode") === "button";
        const heading = this.getAttribute("heading") || L.heading;
        const headingId = `${this.#id}-heading`;
        const card = `<div class="card" part="card">${data ? this.#cardBody(data, L, heading, headingId, isButton) : `<p class="empty">${esc(L.noUrl)}</p>`}</div>`;
        // A <dialog> of its own, so it sits in the top layer — above the share dialog too.
        const hint = `<dialog class="wx-hint" part="wechat-hint" aria-label="${esc(L.more)}">
        ${icons.arrow}
        <p class="wx-hint-text">${esc(L.wechatHint)}</p>
        <button type="button" class="pill" data-action="hint-close">${esc(L.gotIt)}</button>
      </dialog>`;
        // Keep an open share dialog open (and its status message) across re-renders.
        const oldDialog = this.#root.querySelector("dialog:not(.wx-hint)");
        const wasOpen = !!oldDialog?.open;
        const oldStatus = this.#root.querySelector(".status");
        const status = oldStatus ? { text: oldStatus.textContent ?? "", visible: !oldStatus.classList.contains("sr-only") } : null;
        const focused = this.#root.activeElement?.dataset;
        const focusKey = focused ? `${focused.action ?? ""}|${focused.target ?? ""}|${focused.method ?? ""}` : "";
        this.#rerendering = true;
        this.#root.innerHTML = isButton
            ? `<style>${styles}</style>
         <button type="button" class="trigger" part="trigger" data-action="open" aria-haspopup="dialog">${icons.share}<span>${esc(L.share)}</span></button>
         <dialog part="dialog" aria-labelledby="${headingId}">${card}</dialog>${hint}`
            : `<style>${styles}</style>${card}${hint}`;
        this.#rerendering = false;
        const dialog = this.#root.querySelector("dialog:not(.wx-hint)");
        if (dialog) {
            dialog.addEventListener("close", () => {
                if (this.#rerendering)
                    return;
                this.#root.querySelector(".trigger")?.focus();
                this.#emit("sh-close", { method: "dialog" });
            });
            if (wasOpen && this.isConnected)
                dialog.showModal();
        }
        this.#root.querySelector("dialog.wx-hint")?.addEventListener("close", () => {
            this.#hintOpener?.focus?.();
            this.#hintOpener = null;
        });
        if (status?.text)
            this.#status(status.text, status.visible);
        if (focusKey) {
            const again = [...this.#root.querySelectorAll("[data-action]")].find((el) => `${el.dataset.action ?? ""}|${el.dataset.target ?? ""}|${el.dataset.method ?? ""}` === focusKey);
            again?.focus({ preventScroll: true });
        }
        const slot = this.#root.querySelector('slot[name="preview"]');
        slot?.addEventListener("slotchange", () => this.#syncPreview());
        this.#syncPreview();
        if (this.#qrOpen)
            this.#fillQr();
    }
    #cardBody(data, L, heading, headingId, isButton) {
        const items = this.#items(data);
        const closable = isButton || this.hasAttribute("closable");
        const brand = this.hasAttribute("brand-colors");
        // brand-colors: app-icon style tiles in the brand colour, with a black or
        // white glyph depending on how light the colour is.
        const inner = (icon, label, color) => {
            const tile = brand && color && safeColor(color) ? ` style="--sh-tile:${color};--sh-on-tile:${onColor(color)}"` : "";
            return `<span class="icon"${tile}>${icon}</span><span class="label">${esc(label)}</span>`;
        };
        const env = this.#env ?? detectEnv();
        this.#rendered = new Map();
        const html = items
            .map((item, i) => {
            const autofocus = i === 0 && isButton ? " autofocus" : "";
            if (item.kind === "builtin") {
                switch (item.id) {
                    case "copy":
                        return `<button type="button" class="action" part="action action-copy" data-action="copy" data-method="copy-link"${autofocus}>${inner(icons.link, L.copyLink)}</button>`;
                    case "qr":
                        return `<button type="button" class="action" part="action action-qr" data-action="qr" aria-expanded="${this.#qrOpen}" aria-controls="${this.#id}-qr"${autofocus}>${inner(icons.qr, L.qr)}</button>`;
                    case "native":
                        return `<button type="button" class="action" part="action action-native" data-action="native"${autofocus}>${inner(icons.more, L.more)}</button>`;
                }
            }
            const { target } = item;
            const label = targetLabel(target, this.#rawLang());
            const icon = target.icon ?? brandIcon(target.id) ?? monogram(MONOGRAMS[target.id] ?? label, brand);
            const part = `action action-target action-${esc(target.id)}`;
            // A plain link only when nothing has to happen before opening it.
            const isLink = !target.onSelect &&
                !target.copy &&
                !target.app &&
                !target.insideApp?.(env) &&
                !(target.desktop === "qr" && !env.mobile);
            const href = isLink ? resolveTargetHref(target, this.#context(target, data)) : null;
            if (isLink && !href)
                return "";
            this.#rendered.set(target.id, target);
            if (href) {
                const newTab = target.newTab ?? /^https?:/i.test(href);
                return `<a class="action" part="${part}" data-action="target" data-target="${esc(target.id)}" href="${esc(href)}"${newTab ? ` target="_blank" rel="noopener noreferrer"` : ""}${autofocus}>${inner(icon, label, target.color)}</a>`;
            }
            return `<button type="button" class="action" part="${part}" data-action="target" data-target="${esc(target.id)}"${autofocus}>${inner(icon, label, target.color)}</button>`;
        })
            .filter(Boolean);
        const count = html.length;
        return `
      <div class="preview" part="preview" hidden>
        <slot name="preview">${this.#previewFallback()}</slot>
      </div>
      <hr class="divider" part="divider" hidden>
      <div class="header">
        <h2 class="heading" part="heading" id="${headingId}">${esc(heading)}</h2>
        ${closable ? `<button type="button" class="close" part="close" data-action="close" aria-label="${esc(L.close)}">${icons.close}</button>` : ""}
      </div>
      ${count ? `<div class="actions${brand ? " tiles" : ""}" part="actions">${html.join("")}</div>` : ""}
      <div class="qr" part="qr" id="${this.#id}-qr" ${this.#qrOpen ? "" : "hidden"}>
        <div class="qr-code" part="qr-code" role="img" aria-label="${esc(L.qrAlt)}"></div>
        <p class="qr-hint">${esc(L.scanHint)}</p>
        <button type="button" class="pill outline" part="download" data-action="download">${icons.download}<span>${esc(L.download)}</span></button>
      </div>
      <div class="url-row" part="url-row">
        <a class="url" part="url" href="${esc(data.url)}" target="_blank" rel="noopener noreferrer" title="${esc(L.openLink)}"><span class="url-text">${esc(data.url)}</span>${icons.external}</a>
        <button type="button" class="pill" part="copy-button" data-action="copy" data-method="copy-button">${esc(L.copy)}</button>
      </div>
      <p class="status" part="status" role="status" aria-live="polite"></p>`;
    }
    #previewFallback() {
        const title = this.getAttribute("preview-title");
        const subtitle = this.getAttribute("preview-subtitle");
        const meta = this.getAttribute("preview-meta");
        const image = safeImage(this.getAttribute("image"));
        if (!title && !subtitle && !meta && !image)
            return "";
        return `${image ? `<img part="preview-image" src="${esc(image)}" alt="" loading="lazy">` : ""}
      <div class="preview-body">
        ${title ? `<p class="p-title" part="preview-title">${esc(title)}</p>` : ""}
        ${subtitle ? `<p class="p-subtitle" part="preview-subtitle">${esc(subtitle)}</p>` : ""}
        ${meta ? `<p class="p-meta" part="preview-meta">${esc(meta)}</p>` : ""}
      </div>`;
    }
    /** Show the preview block (and divider) only when there is something in it. */
    #syncPreview() {
        const preview = this.#root.querySelector(".preview");
        const divider = this.#root.querySelector(".divider");
        if (!preview || !divider)
            return;
        const slot = preview.querySelector("slot");
        const has = (slot?.assignedNodes({ flatten: true }) ?? []).some((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent?.trim()));
        preview.hidden = divider.hidden = !has;
    }
    #fillQr() {
        const data = this.#data();
        const box = this.#root.querySelector(".qr-code");
        if (!data || !box)
            return;
        box.innerHTML = qrSvg(this.#urlFor("qr", data.url));
    }
    // ---- interaction ----------------------------------------------------------
    #onClick(event) {
        const origin = event.target;
        // Click on the dialog's backdrop (outside the card) closes it.
        if (origin instanceof HTMLDialogElement) {
            origin.close();
            return;
        }
        const el = origin?.closest("[data-action]");
        if (!el)
            return;
        const data = this.#data();
        switch (el.dataset.action) {
            case "open":
                this.open();
                return;
            case "close":
                this.close();
                return;
            case "hint-close":
                this.#hint(null);
                return;
        }
        if (!data)
            return;
        switch (el.dataset.action) {
            case "copy":
                void this.#copy(el, data);
                break;
            case "qr":
                this.#toggleQr(data);
                break;
            case "download":
                void this.#download(data);
                break;
            case "native":
                void this.#native(data);
                break;
            case "target": {
                const target = this.#rendered.get(el.dataset.target ?? "");
                if (target)
                    void this.#runTarget(target, data, el instanceof HTMLAnchorElement, el);
                break;
            }
        }
    }
    async #copy(button, data) {
        const L = this.#strings();
        const method = button.dataset.method ?? "copy";
        const url = this.#urlFor("copy", data.url);
        const ok = await copyText(url, this.#copyContainer());
        this.#emit("sh-copy", { method, url, ok });
        if (!ok) {
            this.#copyFailed();
            return;
        }
        this.#status(L.linkCopied);
        const label = button.classList.contains("action") ? button.querySelector(".label") : button;
        const icon = button.querySelector(".icon");
        if (!label)
            return;
        const previous = this.#timers.get(button);
        if (previous)
            clearTimeout(previous);
        else
            button.dataset.label = label.textContent ?? "";
        label.textContent = L.copied;
        if (icon)
            icon.innerHTML = icons.check;
        button.classList.add("is-done");
        this.#timers.set(button, setTimeout(() => {
            label.textContent = button.dataset.label ?? "";
            if (icon)
                icon.innerHTML = icons.link;
            button.classList.remove("is-done");
            this.#timers.delete(button);
            this.#status("");
        }, 2000));
    }
    /** Tell the user copying failed and select the link so they can copy it by hand. */
    #copyFailed() {
        this.#status(this.#strings().copyFailed, true);
        const text = this.#root.querySelector(".url-text");
        const selection = globalThis.getSelection?.();
        if (text && selection) {
            const range = document.createRange();
            range.selectNodeContents(text);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    #toggleQr(data, force) {
        this.#qrOpen = force ?? !this.#qrOpen;
        const panel = this.#root.querySelector(".qr");
        if (panel)
            panel.hidden = !this.#qrOpen;
        this.#root.querySelector('[data-action="qr"]')?.setAttribute("aria-expanded", String(this.#qrOpen));
        if (this.#qrOpen)
            this.#fillQr();
        this.#emit("sh-qr", { method: "qr", url: this.#urlFor("qr", data.url), open: this.#qrOpen });
    }
    async #download(data) {
        const url = this.#urlFor("qr", data.url);
        try {
            const blob = await qrPngBlob(url, { scale: 12 });
            const href = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = href;
            a.download = `qr-${slug(data.title) || "link"}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(href), 10_000);
            this.#emit("sh-download", { method: "png", url, ok: true });
        }
        catch {
            this.#emit("sh-download", { method: "png", url, ok: false });
        }
    }
    async #native(data) {
        if (this.#env?.wechat) {
            this.#hint(this.#strings().wechatHint, this.#root.querySelector('[data-action="native"]'));
            this.#emit("sh-share", { method: "wechat-hint", url: data.url });
            return;
        }
        const url = this.#urlFor("native", data.url);
        const result = await nativeShare({ ...data, url }, this.#template());
        this.#emit("sh-share", { method: "native", url, result, ok: result === "shared" });
        if (result === "failed" || result === "unsupported")
            this.#status(this.#strings().shareFailed, true);
    }
    /**
     * Run a share target. Link targets were rendered as <a>, so the browser
     * already navigates — we only report it. Others copy and/or open an app, or
     * run their own onSelect.
     */
    async #runTarget(target, data, isLink, origin) {
        const ctx = this.#context(target, data);
        const L = this.#strings();
        const name = targetLabel(target, this.#rawLang());
        const report = (detail) => this.#emit("sh-share", { method: target.id, url: ctx.url, ...detail });
        const copyNow = async (value) => copyTextSync(value, this.#copyContainer()) || (await copyText(value, this.#copyContainer()));
        if (isLink) {
            report({});
            return;
        }
        if (target.onSelect) {
            try {
                await target.onSelect(ctx, this.#tools(data, origin));
                report({ ok: true });
            }
            catch {
                report({ ok: false });
            }
            return;
        }
        // 1. Already inside this app's browser (e.g. WeChat): its own ··· menu is the way to share.
        if (target.insideApp?.(ctx.env)) {
            this.#hint(target.id === "wechat" ? L.wechatHint : fill(L.menuHint, name), origin);
            report({ result: "menu-hint" });
            return;
        }
        const copyValue = target.copy === "message" ? ctx.message : ctx.url;
        // 2. Phone-first app on a computer: copy the link, and show the QR code to scan with the phone.
        if (target.desktop === "qr" && !ctx.env.mobile) {
            const ok = await copyNow(copyValue);
            this.#toggleQr(data, true);
            this.#status(fill(ok ? L.copiedScan : L.scanWith, name), true);
            report({ result: "qr", ok });
            return;
        }
        // Where to go after copying: the app, or the target's own link.
        const destination = resolveAppScheme(target.app, ctx) ?? resolveTargetHref(target, ctx);
        // 3. In-app browsers (WeChat, Instagram, Android WebViews…) block URL schemes: copy only.
        const blocked = !!destination && !isWebUrl(destination) && ctx.env.inAppBrowser;
        // 4. Copy first, synchronously: opening an app or tab takes focus away from
        //    the page, and the async Clipboard API is refused once that happens.
        //    Staying synchronous also keeps us inside the tap, which browsers
        //    require for opening apps and tabs. Async copy is only the fallback.
        //    Targets without `copy` still copy the link when we can't open anything,
        //    so the user always has something to paste.
        const mustCopy = !!target.copy || !destination || blocked;
        if (mustCopy) {
            const copied = await copyNow(copyValue);
            if (!copied) {
                this.#copyFailed();
                report({ ok: false });
                return;
            }
        }
        if (!destination || blocked) {
            this.#status(fill(L.copiedPaste, name), true);
            report({ result: blocked ? "blocked" : "copied", ok: true });
            return;
        }
        let launching = Promise.resolve("unknown");
        if (isWebUrl(destination)) {
            if (target.newTab === false)
                globalThis.location.assign(destination);
            else
                globalThis.open?.(destination, "_blank", "noopener,noreferrer");
        }
        else {
            launching = launchApp(destination);
        }
        this.#status(fill(target.copy ? L.copiedOpening : L.opening, name), true);
        const result = await launching;
        if (result === "not-opened")
            this.#status(fill(target.copy ? L.appNotOpenedCopied : L.appNotOpened, name), true);
        report({ result, ok: result !== "not-opened" });
    }
    /** Where the temporary copy textarea may go: inside the open dialog if there is one (outside it is inert). */
    #copyContainer() {
        const open = this.#root.querySelector("dialog[open]:not(.wx-hint)");
        return open ?? this.#root.querySelector(".card") ?? this.#root;
    }
    #tools(data, origin) {
        return {
            copy: async (text) => copyTextSync(text, this.#copyContainer()) || (await copyText(text, this.#copyContainer())),
            open: (url, newTab) => {
                if (!isAllowedHref(url))
                    return;
                if (!isWebUrl(url) && !newTab) {
                    void launchApp(url);
                    return;
                }
                const tab = newTab ?? /^https?:/i.test(url);
                if (tab)
                    globalThis.open?.(url, "_blank", "noopener,noreferrer");
                else
                    globalThis.location.href = url;
            },
            launchApp: (scheme) => (isAllowedHref(scheme) ? launchApp(scheme) : Promise.resolve("not-opened")),
            status: (message, visible = true) => this.#status(message, visible),
            openQr: () => this.#toggleQr(data, true),
            pointToMenu: (message) => this.#hint(message, origin),
        };
    }
    /** Show the full-screen "tap ··· top-right" hint with a message, or hide it (null). */
    #hint(message, opener) {
        const hint = this.#root.querySelector("dialog.wx-hint");
        if (!hint)
            return;
        if (message === null) {
            if (hint.open)
                hint.close();
            return;
        }
        const text = hint.querySelector(".wx-hint-text");
        if (text)
            text.textContent = message;
        this.#hintOpener = opener ?? this.#root.activeElement;
        if (!hint.open)
            hint.showModal();
        hint.querySelector("button")?.focus();
    }
    /** Announce a message; `visible` also shows it under the panel (used for errors and app hand-offs). */
    #status(message, visible = false) {
        const status = this.#root.querySelector(".status");
        if (!status)
            return;
        status.classList.toggle("sr-only", !visible);
        status.textContent = message;
    }
    #emit(name, detail, cancelable = false) {
        const url = detail.url ?? this.#data()?.url ?? "";
        return this.dispatchEvent(new CustomEvent(name, { detail: { ...detail, url }, bubbles: true, composed: true, cancelable }));
    }
}
/** Letters for built-in brands we don't ship a logo for. */
const MONOGRAMS = { linkedin: "in", teams: "T", outlook: "O", slack: "S", band: "B", dingtalk: "D", qzone: "Q" };
/** Black or white, whichever reads better on the given colour (hex only; others get white). */
function onColor(color) {
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
    if (!hex)
        return "#fff";
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(full.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Contrast with white vs. with near-black (#111, luminance ≈ 0.0056).
    return (1.05 / (luminance + 0.05)) >= ((luminance + 0.05) / 0.0556) ? "#fff" : "#111";
}
/** Only plain colour values may go into the inline style. */
function safeColor(value) {
    return /^(#[0-9a-f]{3,8}|[a-z]{3,20}|(rgb|rgba|hsl|hsla|oklch|oklab)\([0-9.,%\s/-]+\))$/i.test(value.trim());
}
function fill(template, app) {
    return template.replace(/\{app\}/g, app);
}
function esc(value) {
    return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
function safeImage(src) {
    if (!src)
        return null;
    if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(src))
        return src;
    try {
        const url = new URL(src, globalThis.document?.baseURI);
        return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "blob:" ? url.href : null;
    }
    catch {
        return null;
    }
}
function httpImage(src) {
    return src && /^https?:\/\//i.test(src) ? src : "";
}
function slug(value) {
    return (value ?? "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}
/**
 * Register the element (default tag "share-hop"). Safe to call more than
 * once and safe to call on the server, where it does nothing.
 */
export function defineShareHop(tagName = "share-hop") {
    const registry = globalThis.customElements;
    if (!registry || registry.get(tagName))
        return;
    // A constructor can only be registered once, so other tag names get a subclass.
    const used = registry.getName?.(ShareHopElement);
    registry.define(tagName, used ? class extends ShareHopElement {
    } : ShareHopElement);
}
