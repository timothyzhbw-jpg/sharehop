import { resolveShareUrl, withShareSource, type ShareData } from "../core/text.ts";
import { copyText } from "../core/clipboard.ts";
import { canNativeShare, nativeShare } from "../core/native.ts";
import { shareTargetUrl } from "../core/targets.ts";
import { detectEnv, type ShareEnvironment } from "../core/env.ts";
import { qrPngBlob, qrSvg } from "../core/qr.ts";
import { LABELS, resolveLang, type ShareWidgetLabels } from "./labels.ts";
import { icons } from "./icons.ts";
import { styles } from "./styles.ts";

export type ShareAction = "copy" | "qr" | "whatsapp" | "email" | "native";
export const DEFAULT_ACTIONS: readonly ShareAction[] = ["copy", "qr", "whatsapp", "native"];
const KNOWN_ACTIONS = new Set<string>(["copy", "qr", "whatsapp", "email", "native"]);

/** detail of the sw-copy / sw-share / sw-qr / sw-download / sw-open / sw-close events. */
export interface ShareWidgetEventDetail {
  method: string;
  url: string;
  ok?: boolean;
  result?: string;
  open?: boolean;
}

// Lets the module be imported during server rendering, where HTMLElement does not exist.
const Base = (typeof HTMLElement === "undefined" ? class {} : HTMLElement) as typeof HTMLElement;

let instances = 0;

export class ShareWidgetElement extends Base {
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
    "image",
    "preview-title",
    "preview-subtitle",
    "preview-meta",
  ];

  #root: ShadowRoot;
  #id = `sw${++instances}`;
  #labels: Partial<ShareWidgetLabels> = {};
  #env: ShareEnvironment | null = null;
  #qrOpen = false;
  #timers = new Map<Element, ReturnType<typeof setTimeout>>();

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.addEventListener("click", (event) => this.#onClick(event as MouseEvent));
  }

  /** Override any built-in text, e.g. `el.labels = { heading: "Share this listing" }`. */
  get labels(): Partial<ShareWidgetLabels> {
    return { ...this.#labels };
  }
  set labels(value: Partial<ShareWidgetLabels> | null | undefined) {
    this.#labels = { ...(value ?? {}) };
    if (this.isConnected) this.#render();
  }

  /** Open the panel (button mode) — e.g. from your own Share button. */
  open(): void {
    const dialog = this.#root.querySelector("dialog");
    if (dialog && !dialog.open) {
      dialog.showModal();
      this.#emit("sw-open", { method: "dialog" });
    }
  }

  /** Close the panel (button mode) or hide it (panel mode). */
  close(): void {
    const dialog = this.#root.querySelector("dialog");
    if (dialog) {
      dialog.close();
      return;
    }
    if (this.#emit("sw-close", { method: "panel" }, true)) this.hidden = true;
  }

  connectedCallback(): void {
    this.#env ??= detectEnv();
    this.#render();
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue && this.isConnected) this.#render();
  }

  // ---- data ---------------------------------------------------------------

  #strings(): ShareWidgetLabels {
    const lang = resolveLang(this.getAttribute("lang") ?? this.closest("[lang]")?.getAttribute("lang"));
    return { ...LABELS[lang], ...this.#labels };
  }

  #data(): ShareData | null {
    const base = globalThis.document?.baseURI;
    const url = resolveShareUrl(this.getAttribute("url"), base);
    if (!url) return null;
    return {
      url,
      title: this.getAttribute("share-title") ?? undefined,
      text: this.getAttribute("share-text") ?? undefined,
    };
  }

  /** The link for a channel, tagged with utm_source when the `utm` attribute is set. */
  #urlFor(channel: string, url: string): string {
    return this.hasAttribute("utm") ? withShareSource(url, channel) : url;
  }

  #actions(data: ShareData): ShareAction[] {
    const raw = this.getAttribute("actions");
    const requested = raw
      ? raw.split(/[\s,]+/).filter((a): a is ShareAction => KNOWN_ACTIONS.has(a))
      : [...DEFAULT_ACTIONS];
    const unique = [...new Set(requested)];
    // "More" is only useful where a native share sheet exists — or in WeChat,
    // where it explains WeChat's own share menu instead.
    return unique.filter((a) => a !== "native" || this.#env?.wechat || canNativeShare(data));
  }

  // ---- rendering ------------------------------------------------------------

  #render(): void {
    const L = this.#strings();
    const data = this.#data();
    const isButton = this.getAttribute("mode") === "button";
    const heading = this.getAttribute("heading") || L.heading;
    const headingId = `${this.#id}-heading`;

    const card = `<div class="card" part="card">${
      data ? this.#cardBody(data, L, heading, headingId, isButton) : `<p class="empty">${esc(L.noUrl)}</p>`
    }</div>`;

    const hint = `<div class="wx-hint" part="wechat-hint" role="dialog" aria-modal="true" aria-label="${esc(L.more)}" hidden>
        ${icons.arrow}
        <p>${esc(L.wechatHint)}</p>
        <button type="button" class="pill" data-action="hint-close">${esc(L.gotIt)}</button>
      </div>`;

    this.#root.innerHTML = isButton
      ? `<style>${styles}</style>
         <button type="button" class="trigger" part="trigger" data-action="open" aria-haspopup="dialog">${icons.share}<span>${esc(L.share)}</span></button>
         <dialog part="dialog" aria-labelledby="${headingId}">${card}</dialog>${hint}`
      : `<style>${styles}</style>${card}${hint}`;

    const dialog = this.#root.querySelector("dialog");
    if (dialog) {
      dialog.addEventListener("close", () => {
        this.#root.querySelector<HTMLElement>(".trigger")?.focus();
        this.#emit("sw-close", { method: "dialog" });
      });
    }

    const slot = this.#root.querySelector<HTMLSlotElement>('slot[name="preview"]');
    slot?.addEventListener("slotchange", () => this.#syncPreview());
    this.#syncPreview();
    if (this.#qrOpen) this.#fillQr();
  }

  #cardBody(data: ShareData, L: ShareWidgetLabels, heading: string, headingId: string, isButton: boolean): string {
    const actions = this.#actions(data);
    const closable = isButton || this.hasAttribute("closable");
    const displayUrl = data.url;

    const button = (action: ShareAction, icon: string, label: string, extra = "") =>
      `<button type="button" class="action" part="action action-${action}" data-action="${action}" ${extra}><span class="icon">${icon}</span><span class="label">${esc(label)}</span></button>`;

    const items = actions
      .map((action, i) => {
        const autofocus = i === 0 && isButton ? "autofocus" : "";
        switch (action) {
          case "copy":
            return button("copy", icons.link, L.copyLink, `data-method="copy-link" ${autofocus}`);
          case "qr":
            return button(
              "qr",
              icons.qr,
              L.qr,
              `aria-expanded="${this.#qrOpen}" aria-controls="${this.#id}-qr" ${autofocus}`,
            );
          case "whatsapp":
          case "email": {
            const href = shareTargetUrl(action, { ...data, url: this.#urlFor(action, data.url) }, this.#template());
            const target = action === "whatsapp" ? `target="_blank" rel="noopener noreferrer"` : "";
            return `<a class="action" part="action action-${action}" data-action="${action}" href="${esc(href)}" ${target} ${autofocus}><span class="icon">${
              action === "whatsapp" ? icons.chat : icons.mail
            }</span><span class="label">${esc(action === "whatsapp" ? L.whatsapp : L.email)}</span></a>`;
          }
          case "native":
            return button("native", icons.more, L.more, autofocus);
        }
      })
      .join("");

    return `
      <div class="preview" part="preview" hidden>
        <slot name="preview">${this.#previewFallback()}</slot>
      </div>
      <hr class="divider" part="divider" hidden>
      <div class="header">
        <h2 class="heading" part="heading" id="${headingId}">${esc(heading)}</h2>
        ${closable ? `<button type="button" class="close" part="close" data-action="close" aria-label="${esc(L.close)}">${icons.close}</button>` : ""}
      </div>
      ${actions.length ? `<div class="actions" part="actions" style="--sw-columns:${actions.length}">${items}</div>` : ""}
      <div class="qr" part="qr" id="${this.#id}-qr" ${this.#qrOpen ? "" : "hidden"}>
        <div class="qr-code" part="qr-code" role="img" aria-label="${esc(L.qrAlt)}"></div>
        <p class="qr-hint">${esc(L.scanHint)}</p>
        <button type="button" class="pill outline" part="download" data-action="download">${icons.download}<span>${esc(L.download)}</span></button>
      </div>
      <div class="url-row" part="url-row">
        <a class="url" part="url" href="${esc(data.url)}" target="_blank" rel="noopener noreferrer" title="${esc(L.openLink)}"><span class="url-text">${esc(displayUrl)}</span>${icons.external}</a>
        <button type="button" class="pill" part="copy-button" data-action="copy" data-method="copy-button">${esc(L.copy)}</button>
      </div>
      <p class="status" part="status" role="status" aria-live="polite"></p>`;
  }

  #previewFallback(): string {
    const title = this.getAttribute("preview-title");
    const subtitle = this.getAttribute("preview-subtitle");
    const meta = this.getAttribute("preview-meta");
    const image = safeImage(this.getAttribute("image"));
    if (!title && !subtitle && !meta && !image) return "";
    return `${image ? `<img part="preview-image" src="${esc(image)}" alt="" loading="lazy">` : ""}
      <div class="preview-body">
        ${title ? `<p class="p-title" part="preview-title">${esc(title)}</p>` : ""}
        ${subtitle ? `<p class="p-subtitle" part="preview-subtitle">${esc(subtitle)}</p>` : ""}
        ${meta ? `<p class="p-meta" part="preview-meta">${esc(meta)}</p>` : ""}
      </div>`;
  }

  /** Show the preview block (and divider) only when there is something in it. */
  #syncPreview(): void {
    const preview = this.#root.querySelector<HTMLElement>(".preview");
    const divider = this.#root.querySelector<HTMLElement>(".divider");
    if (!preview || !divider) return;
    const slot = preview.querySelector<HTMLSlotElement>("slot");
    const has = (slot?.assignedNodes({ flatten: true }) ?? []).some(
      (n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent?.trim()),
    );
    preview.hidden = divider.hidden = !has;
  }

  #template(): string | undefined {
    return this.getAttribute("template") ?? undefined;
  }

  #fillQr(): void {
    const data = this.#data();
    const box = this.#root.querySelector<HTMLElement>(".qr-code");
    if (!data || !box) return;
    box.innerHTML = qrSvg(this.#urlFor("qr", data.url));
  }

  // ---- interaction ----------------------------------------------------------

  #onClick(event: MouseEvent): void {
    const origin = event.target as Element | null;
    // Click on the dialog's backdrop (outside the card) closes it.
    if (origin instanceof HTMLDialogElement) {
      origin.close();
      return;
    }
    const el = origin?.closest<HTMLElement>("[data-action]");
    if (!el) return;
    const data = this.#data();

    switch (el.dataset.action) {
      case "open":
        this.open();
        return;
      case "close":
        this.close();
        return;
      case "hint-close":
        this.#hint(false);
        return;
    }
    if (!data) return;

    switch (el.dataset.action) {
      case "copy":
        void this.#copy(el, data);
        break;
      case "qr":
        this.#toggleQr(el, data);
        break;
      case "download":
        void this.#download(data);
        break;
      case "whatsapp":
      case "email":
        this.#emit("sw-share", { method: el.dataset.action, url: this.#urlFor(el.dataset.action, data.url) });
        break;
      case "native":
        void this.#native(data);
        break;
    }
  }

  async #copy(button: HTMLElement, data: ShareData): Promise<void> {
    const L = this.#strings();
    const method = button.dataset.method ?? "copy";
    const url = this.#urlFor("copy", data.url);
    const ok = await copyText(url);
    this.#emit("sw-copy", { method, url, ok });

    if (!ok) {
      this.#status(L.copyFailed, true);
      const text = this.#root.querySelector(".url-text");
      const selection = globalThis.getSelection?.();
      if (text && selection) {
        const range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }

    this.#status(L.linkCopied);
    const label = button.classList.contains("action") ? button.querySelector(".label") : button;
    const icon = button.querySelector(".icon");
    if (!label) return;
    const previous = this.#timers.get(button);
    if (previous) clearTimeout(previous);
    else button.dataset.label = label.textContent ?? "";
    label.textContent = L.copied;
    if (icon) icon.innerHTML = icons.check;
    button.classList.add("is-done");
    this.#timers.set(
      button,
      setTimeout(() => {
        label.textContent = button.dataset.label ?? "";
        if (icon) icon.innerHTML = icons.link;
        button.classList.remove("is-done");
        this.#timers.delete(button);
        this.#status("");
      }, 2000),
    );
  }

  #toggleQr(button: HTMLElement, data: ShareData): void {
    this.#qrOpen = !this.#qrOpen;
    const panel = this.#root.querySelector<HTMLElement>(".qr");
    if (panel) panel.hidden = !this.#qrOpen;
    button.setAttribute("aria-expanded", String(this.#qrOpen));
    if (this.#qrOpen) this.#fillQr();
    this.#emit("sw-qr", { method: "qr", url: this.#urlFor("qr", data.url), open: this.#qrOpen });
  }

  async #download(data: ShareData): Promise<void> {
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
      this.#emit("sw-download", { method: "png", url, ok: true });
    } catch {
      this.#emit("sw-download", { method: "png", url, ok: false });
    }
  }

  async #native(data: ShareData): Promise<void> {
    if (this.#env?.wechat) {
      this.#hint(true);
      this.#emit("sw-share", { method: "wechat-hint", url: data.url });
      return;
    }
    const url = this.#urlFor("native", data.url);
    const result = await nativeShare({ ...data, url }, this.#template());
    this.#emit("sw-share", { method: "native", url, result, ok: result === "shared" });
    if (result === "failed" || result === "unsupported") this.#status(this.#strings().shareFailed, true);
  }

  #hint(show: boolean): void {
    const hint = this.#root.querySelector<HTMLElement>(".wx-hint");
    if (!hint) return;
    hint.hidden = !show;
    if (show) hint.querySelector<HTMLElement>("button")?.focus();
    else this.#root.querySelector<HTMLElement>('[data-action="native"]')?.focus();
  }

  /** Announce a message; `visible` also shows it under the panel (used for errors). */
  #status(message: string, visible = false): void {
    const status = this.#root.querySelector(".status");
    if (!status) return;
    status.classList.toggle("sr-only", !visible);
    status.textContent = message;
  }

  #emit(name: string, detail: Partial<ShareWidgetEventDetail> & { method: string }, cancelable = false): boolean {
    const url = detail.url ?? this.#data()?.url ?? "";
    return this.dispatchEvent(
      new CustomEvent<ShareWidgetEventDetail>(name, { detail: { ...detail, url }, bubbles: true, composed: true, cancelable }),
    );
  }
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function safeImage(src: string | null): string | null {
  if (!src) return null;
  if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(src)) return src;
  try {
    const url = new URL(src, globalThis.document?.baseURI);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "blob:" ? url.href : null;
  } catch {
    return null;
  }
}

function slug(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Register the element (default tag "share-widget"). Safe to call more than
 * once and safe to call on the server, where it does nothing.
 */
export function defineShareWidget(tagName = "share-widget"): void {
  const registry = globalThis.customElements;
  if (!registry || registry.get(tagName)) return;
  // A constructor can only be registered once, so other tag names get a subclass.
  const used = registry.getName?.(ShareWidgetElement);
  registry.define(tagName, used ? class extends ShareWidgetElement {} : ShareWidgetElement);
}
