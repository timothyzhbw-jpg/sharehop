export declare const icons: {
    readonly link: string;
    readonly qr: string;
    readonly chat: string;
    readonly more: string;
    readonly mail: string;
    readonly image: string;
    readonly close: string;
    readonly external: string;
    readonly download: string;
    readonly check: string;
    readonly share: string;
    readonly arrow: "<svg viewBox=\"0 0 80 80\" width=\"80\" height=\"80\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M10 74C18 40 40 20 70 10M52 8l18 2-6 17\"/></svg>";
};
/**
 * Fallback icon: one or two letters in a rounded square, for targets without
 * an icon (custom targets, or brands we don't ship a logo for). `bare` draws
 * only the letters, for use on a coloured tile.
 */
export declare function monogram(text: string, bare?: boolean): string;
