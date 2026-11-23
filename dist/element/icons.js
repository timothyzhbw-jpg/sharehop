const svg = (body) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
export const icons = {
    link: svg('<path d="M10 13.5a4.5 4.5 0 0 0 6.36 0l3.18-3.18a4.5 4.5 0 0 0-6.36-6.36l-1.3 1.3"/><path d="M14 10.5a4.5 4.5 0 0 0-6.36 0l-3.18 3.18a4.5 4.5 0 0 0 6.36 6.36l1.3-1.3"/>'),
    qr: svg('<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM20.5 14v.01M14 20.5v.01M17.5 20.5h3M20.5 17.5v3"/>'),
    chat: svg('<path d="M3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 3.3 3.1z"/>'),
    more: svg('<circle cx="17.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="M8.7 10.7l6.6-3.9M8.7 13.3l6.6 3.9"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
    image: svg('<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><circle cx="9" cy="9.5" r="1.75"/><path d="M20.5 15.5l-4.8-4.8L6 20"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    external: svg('<path d="M8 16L16 8M9.5 8H16v6.5"/>'),
    download: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>'),
    share: svg('<path d="M12 3.5v12M7.5 8L12 3.5 16.5 8M5 13.5v5A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2v-5"/>'),
    arrow: `<svg viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 74C18 40 40 20 70 10M52 8l18 2-6 17"/></svg>`,
};
/**
 * Fallback icon: one or two letters in a rounded square, for targets without
 * an icon (custom targets, or brands we don't ship a logo for). `bare` draws
 * only the letters, for use on a coloured tile.
 */
export function monogram(text, bare = false) {
    const chars = [...text.trim()];
    const letters = (chars.length <= 2 ? chars : chars.slice(0, 1)).join("") || "?";
    const safe = letters.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const size = [...letters].length > 1 ? 10 : 12.5;
    const font = `font-size="${size}" font-weight="700" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"`;
    return bare
        ? `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><text x="12" y="12" dy=".36em" text-anchor="middle" ${font} font-size="${size + 3}" fill="currentColor">${safe}</text></svg>`
        : `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="currentColor"/><text x="12" y="12" dy=".36em" text-anchor="middle" ${font} fill="var(--_bg, #fff)">${safe}</text></svg>`;
}
