"use client";

import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { ShareAction, ShareWidgetEventDetail } from "../element/share-widget.ts";
import type { ShareWidgetLabels } from "../element/labels.ts";
import type { ShareTarget } from "../core/targets.ts";

export type { ShareAction, ShareWidgetEventDetail, ShareWidgetLabels, ShareTarget };

export type ShareWidgetEvent = CustomEvent<ShareWidgetEventDetail>;

export interface ShareWidgetProps {
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
  /** "panel" renders inline (default); "button" renders a Share button that opens the panel. */
  mode?: "panel" | "button";
  lang?: "en" | "zh";
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
  labels?: Partial<ShareWidgetLabels>;
  /** Custom preview content (rendered into the widget's preview slot). */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  onCopy?: (event: ShareWidgetEvent) => void;
  onShare?: (event: ShareWidgetEvent) => void;
  onQr?: (event: ShareWidgetEvent) => void;
  onDownload?: (event: ShareWidgetEvent) => void;
  onOpen?: (event: ShareWidgetEvent) => void;
  onClose?: (event: ShareWidgetEvent) => void;
}

const EVENTS = {
  onCopy: "sw-copy",
  onShare: "sw-share",
  onQr: "sw-qr",
  onDownload: "sw-download",
  onOpen: "sw-open",
  onClose: "sw-close",
} as const;

/**
 * React wrapper for <share-widget>. The custom element is registered on the
 * client only, so this is safe in Next.js server components' children and SSR.
 */
export function ShareWidget(props: ShareWidgetProps) {
  const ref = useRef<HTMLElement & { labels?: Partial<ShareWidgetLabels>; targets?: ShareTarget[] }>(null);
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
    void customElements.whenDefined("share-widget").then(() => {
      el.labels = props.labels ?? {};
    });
  }, [labelsKey]);

  const targets = props.targets;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    void customElements.whenDefined("share-widget").then(() => {
      el.targets = targets ?? [];
    });
  }, [targets]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const entries = Object.entries(EVENTS) as [keyof typeof EVENTS, string][];
    const listeners = entries.map(([prop, type]) => {
      const listener = (event: Event) => handlers.current[prop]?.(event as ShareWidgetEvent);
      el.addEventListener(type, listener);
      return () => el.removeEventListener(type, listener);
    });
    return () => listeners.forEach((off) => off());
  }, []);

  const flag = (value: boolean | undefined) => (value ? "" : undefined);

  return createElement(
    "share-widget",
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
      image: props.image,
      "preview-title": props.previewTitle,
      "preview-subtitle": props.previewSubtitle,
      "preview-meta": props.previewMeta,
    },
    props.children == null ? null : createElement("div", { slot: "preview" }, props.children),
  );
}
