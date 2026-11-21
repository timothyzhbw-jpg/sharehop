export interface ShareHopLabels {
    /** Trigger button text in button mode. */
    share: string;
    /** Panel heading when no `heading` attribute is set. */
    heading: string;
    copyLink: string;
    qr: string;
    more: string;
    /** Text of the pill button in the link row. */
    copy: string;
    /** Shown on a copy button for two seconds after copying. */
    copied: string;
    /** Announced to screen readers after copying. */
    linkCopied: string;
    copyFailed: string;
    shareFailed: string;
    openLink: string;
    close: string;
    scanHint: string;
    download: string;
    qrAlt: string;
    wechatHint: string;
    gotIt: string;
    noUrl: string;
    /** App hand-off messages; {app} is replaced by the app's name. */
    copiedOpening: string;
    opening: string;
    appNotOpened: string;
    appNotOpenedCopied: string;
    copiedPaste: string;
    copiedScan: string;
    scanWith: string;
    menuHint: string;
}
export type ShareHopLang = "en" | "zh";
export declare const LABELS: Record<ShareHopLang, ShareHopLabels>;
export declare function resolveLang(value: string | null | undefined): ShareHopLang;
