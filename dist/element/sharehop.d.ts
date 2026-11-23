import { type ShareTarget } from "../core/targets.ts";
import { type ShareHopLabels } from "./labels.ts";
/** Built-in buttons, plus any registered share-target id ("telegram", "x", "wechat", …). */
export type ShareAction = "copy" | "qr" | "native" | "poster" | (string & {});
export declare const DEFAULT_ACTIONS: readonly ShareAction[];
/** detail of the sh-copy / sh-share / sh-qr / sh-download / sh-poster / sh-open / sh-close events. */
export interface ShareHopEventDetail {
    /** What was used: "copy-link", "copy-button", "native", "wechat-hint", or a target id such as "telegram". */
    method: string;
    /** The link that was shared (with UTM tags if enabled). */
    url: string;
    ok?: boolean;
    /** native: "shared" | "cancelled" | "failed" | "unsupported"; app targets: "opened" | "not-opened" | "unknown". */
    result?: string;
    open?: boolean;
    /** The share title (from share-title, or the page's og:title with page-meta). */
    title?: string;
}
declare const Base: typeof HTMLElement;
export declare class ShareHopElement extends Base {
    #private;
    static observedAttributes: string[];
    constructor();
    /** Override any built-in text, e.g. `el.labels = { heading: "Share this listing" }`. */
    get labels(): Partial<ShareHopLabels>;
    set labels(value: Partial<ShareHopLabels> | null | undefined);
    /**
     * Share targets for this widget only (they win over registered ones with the
     * same id). List their ids in `actions` to show them.
     */
    get targets(): ShareTarget[];
    set targets(value: ShareTarget[] | null | undefined);
    /** Open the panel (button mode) — e.g. from your own Share button. */
    open(): void;
    /** Close the panel (button mode) or hide it (panel mode). */
    close(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void;
}
/**
 * Register the element (default tag "share-hop"). Safe to call more than
 * once and safe to call on the server, where it does nothing.
 */
export declare function defineShareHop(tagName?: string): void;
export {};
