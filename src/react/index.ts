"use client";

import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
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

const EVENTS = {
  onCopy: "sh-copy",
  onShare: "sh-share",
  onQr: "sh-qr",
  onDownload: "sh-download",
  onOpen: "sh-open",
  onClose: "sh-close",
  onPoster: "sh-poster",
} as const;

/**
 * React wrapper for <share-hop>. The custom element is registered on the
 * client only, so this is safe in Next.js server components' children and SSR.
 */
export function ShareHop(props: ShareHopProps) {
  const ref = useRef<HTMLElement & { labels?: Partial<ShareHopLabels>; targets?: ShareTarget[] }>(null);
  const handlers = useRef(props);
  handlers.current = props;

  useEffect(() => {
    void import("../element/define.ts");
  }, []);

  const labelsKey = JSON.stringify(props.labels ?? {});
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The element may not be upgraded yet; customElements.whenDefined covers that.
    void customElements.whenDefined("share-hop").then(() => {
      el.labels = props.labels ?? {};
    });
  }, [labelsKey]);

  // Inline arrays get a new identity on every render; only pass them on when
  // their items actually changed (the element also ignores identical lists).
  const targetsRef = useRef<ShareTarget[] | undefined>(undefined);
  const prev = targetsRef.current;
  const next = props.targets;
  const targets =
    prev && next && prev.length === next.length && prev.every((t, i) => t === next[i]) ? prev : next;
  targetsRef.current = targets;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    void customElements.whenDefined("share-hop").then(() => {
      el.targets = targets ?? [];
    });
  }, [targets]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const entries = Object.entries(EVENTS) as [keyof typeof EVENTS, string][];
    const listeners = entries.map(([prop, type]) => {
      const listener = (event: Event) => handlers.current[prop]?.(event as ShareHopEvent);
      el.addEventListener(type, listener);
      return () => el.removeEventListener(type, listener);
    });
    return () => listeners.forEach((off) => off());
  }, []);

  const flag = (value: boolean | undefined) => (value ? "" : undefined);

  return createElement(
    "share-hop",
    {
      ref,
      id: props.id,
      className: props.className,
      style: props.style,
      url: props.url,
      "share-title": props.shareTitle,
      "share-text": props.shareText,
      template: props.template,
      heading: props.heading,
      actions: props.actions?.join(","),
      mode: props.mode,
      lang: props.lang,
      theme: props.theme,
      utm: flag(props.utm),
      closable: flag(props.closable),
      "brand-colors": flag(props.brandColors),
      "page-meta": flag(props.pageMeta),
      appearance: props.appearance,
      "brand-name": props.brandName,
      "poster-format": props.posterFormat,
      "qr-url": props.qrUrl,
      image: props.image,
      "preview-title": props.previewTitle,
      "preview-subtitle": props.previewSubtitle,
      "preview-meta": props.previewMeta,
    },
    props.children == null ? null : createElement("div", { slot: "preview" }, props.children),
    props.trigger == null ? null : createElement("span", { slot: "trigger", style: { display: "contents" } }, props.trigger),
  );
}
