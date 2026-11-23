import { type CSSProperties, type ReactNode } from "react";
import type { ShareAction, ShareHopEventDetail } from "../element/sharehop.ts";
import type { ShareHopLabels } from "../element/labels.ts";
import type { ShareTarget } from "../core/targets.ts";
export type { ShareAction, ShareHopEventDetail, ShareHopLabels, ShareTarget };
export type ShareHopEvent = CustomEvent<ShareHopEventDetail>;
export interface ShareHopProps {
    /** Link to share. Defaults to the current page. Relative URLs are resolved. */
    url?: string;
    /** Used in the share message, the native sheet title and the email subject. */
    shareTitle?: string;
    /** One-line description added to the share message. */
    shareText?: string;
    /** Custom share message with {title}, {text} and {url} placeholders. */
    template?: string;
    /** Panel heading, e.g. "Share this listing". */
    heading?: string;
    /** Which buttons to show, in order: "copy", "qr", "native" and any share-target id. Default: copy, qr, whatsapp, native. */
    actions?: ShareAction[];
    /** Extra share targets for this widget only (list their ids in `actions`). */
    targets?: ShareTarget[];
    /** Colour app icons in their brand colours. */
    brandColors?: boolean;
    /** Fill missing title, text, image and preview from the page's Open Graph tags. */
    pageMeta?: boolean;
    /** "plain" drops the card border, padding and background (to sit inside your own card or sheet). */
    appearance?: "card" | "plain";
    /** Brand name printed on the share image (default: og:site_name or the host name). */
    brandName?: string;
    /** Share image size: "card" 4:5 (default), "story" 9:16, "square". */
    posterFormat?: "card" | "story" | "square";
    /** What QR codes encode, as given — no UTM tags (default: the share link). A short link on your own domain scans best. */
    qrUrl?: string;
    /** Your own trigger button for mode="button" (e.g. your design system's Button). */
    trigger?: ReactNode;
    /** "panel" renders inline (default); "button" renders a Share button that opens the panel. */
    mode?: "panel" | "button";
    /** "en" or "zh" for the widget's text; other codes ("ko", "ja", "ru") pick app names where they differ. */
    lang?: "en" | "zh" | (string & {});
    theme?: "light" | "dark" | "auto";
    /** Append utm_source=<channel>&utm_medium=share to shared links. */
    utm?: boolean;
    /** Show a × in panel mode; clicking it hides the widget (cancel via onClose's preventDefault). */
    closable?: boolean;
    image?: string;
    previewTitle?: string;
    previewSubtitle?: string;
    previewMeta?: string;
    /** Override built-in text. */
    labels?: Partial<ShareHopLabels>;
    /** Custom preview content (rendered into the widget's preview slot). */
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    id?: string;
    onCopy?: (event: ShareHopEvent) => void;
    onShare?: (event: ShareHopEvent) => void;
    onQr?: (event: ShareHopEvent) => void;
    onDownload?: (event: ShareHopEvent) => void;
    onOpen?: (event: ShareHopEvent) => void;
    onClose?: (event: ShareHopEvent) => void;
    onPoster?: (event: ShareHopEvent) => void;
}
/**
 * React wrapper for <share-hop>. The custom element is registered on the
 * client only, so this is safe in Next.js server components' children and SSR.
 */
export declare function ShareHop(props: ShareHopProps): import("react").ReactElement<{
    ref: import("react").RefObject<(HTMLElement & {
        labels?: Partial<ShareHopLabels>;
        targets?: ShareTarget[];
    }) | null>;
    id: string | undefined;
    className: string | undefined;
    style: CSSProperties | undefined;
    url: string | undefined;
    "share-title": string | undefined;
    "share-text": string | undefined;
    template: string | undefined;
    heading: string | undefined;
    actions: string | undefined;
    mode: "button" | "panel" | undefined;
    lang: "en" | "zh" | (string & {}) | undefined;
    theme: "dark" | "light" | "auto" | undefined;
    utm: string | undefined;
    closable: string | undefined;
    "brand-colors": string | undefined;
    "page-meta": string | undefined;
    appearance: "card" | "plain" | undefined;
    "brand-name": string | undefined;
    "poster-format": "card" | "story" | "square" | undefined;
    "qr-url": string | undefined;
    image: string | undefined;
    "preview-title": string | undefined;
    "preview-subtitle": string | undefined;
    "preview-meta": string | undefined;
}, string | import("react").JSXElementConstructor<any>>;
