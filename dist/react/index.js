"use client";
import { createElement, useEffect, useRef } from "react";
const EVENTS = {
    onCopy: "sh-copy",
    onShare: "sh-share",
    onQr: "sh-qr",
    onDownload: "sh-download",
    onOpen: "sh-open",
    onClose: "sh-close",
    onPoster: "sh-poster",
};
/**
 * React wrapper for <share-hop>. The custom element is registered on the
 * client only, so this is safe in Next.js server components' children and SSR.
 */
export function ShareHop(props) {
    const ref = useRef(null);
    const handlers = useRef(props);
    handlers.current = props;
    useEffect(() => {
        void import("../element/define.js");
    }, []);
    const labelsKey = JSON.stringify(props.labels ?? {});
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        // The element may not be upgraded yet; customElements.whenDefined covers that.
        void customElements.whenDefined("share-hop").then(() => {
            el.labels = props.labels ?? {};
        });
    }, [labelsKey]);
    // Inline arrays get a new identity on every render; only pass them on when
    // their items actually changed (the element also ignores identical lists).
    const targetsRef = useRef(undefined);
    const prev = targetsRef.current;
    const next = props.targets;
    const targets = prev && next && prev.length === next.length && prev.every((t, i) => t === next[i]) ? prev : next;
    targetsRef.current = targets;
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        void customElements.whenDefined("share-hop").then(() => {
            el.targets = targets ?? [];
        });
    }, [targets]);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const entries = Object.entries(EVENTS);
        const listeners = entries.map(([prop, type]) => {
            const listener = (event) => handlers.current[prop]?.(event);
            el.addEventListener(type, listener);
            return () => el.removeEventListener(type, listener);
        });
        return () => listeners.forEach((off) => off());
    }, []);
    const flag = (value) => (value ? "" : undefined);
    return createElement("share-hop", {
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
    }, props.children == null ? null : createElement("div", { slot: "preview" }, props.children), props.trigger == null ? null : createElement("span", { slot: "trigger", style: { display: "contents" } }, props.trigger));
}
