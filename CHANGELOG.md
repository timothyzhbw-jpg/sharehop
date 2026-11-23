# Changelog

## 0.3.0 — 2026-11-22

- **Share image** (`poster` action): one picture with the item's photo, title, price, brand and a QR code, in 4:5, 9:16 (Stories) or square. Share image (system share sheet with the file) on phones, Save image, press-and-hold inside WeChat. QR codes are sized and drawn to survive chat-app recompression; `qr-url` lets them encode a short link.
- **Fit into the host site:** `slot="trigger"` (React `trigger`) for your own button, `appearance="plain"`, and CSS variables for the card, buttons, trigger, icon tiles, heading, labels, dialog and share image.
- **`page-meta`:** fill title, text, image and the preview from the page's Open Graph tags.
- **Analytics:** `onShareActivity()` (with `sharesOnly`) and `readPageMeta()`; events now carry `title`; new `sh-poster` event (React `onPoster`).
- **WeChat:** on computers the WeChat button says to scan and share from ··· (that path sends a card); inside WeChat the hint mentions the share image. README documents what WeChat and Instagram can and can't do with links.
- Breaking (pre-1.0): `poster` is a reserved target id; `ShareHopLabels` has new keys (only matters if you build a complete labels object yourself — `labels` overrides are partial).

## 0.2.0 — 2026-11-20

- Renamed to **sharehop**: package `sharehop`, element `<share-hop>`, `window.ShareHop` in the script build, React `ShareHop`, `defineShareHop()`, events `sh-*` (were `sw-*`), CSS variables `--sh-*` (were `--sw-*`), script files `dist/sharehop.global.js` / `dist/sharehop.lite.global.js`.
- 43 built-in app targets (WhatsApp, Telegram, LINE, SMS, X, Facebook, LinkedIn, Reddit, Threads, Bluesky, WeChat, QQ, Weibo, Xiaohongshu, Douyin, Instagram, KakaoTalk, Discord, Google Classroom, Teams, Gmail, Outlook and more), each checked against the service's docs and requested live; sources in docs/TARGETS.md.
- Plug-in API: `registerShareTarget()` with URL templates or functions, copy-then-open-app targets, per-platform app schemes, QR-on-desktop, in-app-browser handling, custom `onSelect`. Widgets on the page update when targets change.
- `@presets` in `actions` (`@messaging`, `@china`, `@social`, `@school`, `@korea`, `@japan`).
- `brand-colors` attribute: app icons as brand-coloured tiles with automatic black/white glyphs.
- Per-widget `targets` property (React: `targets` prop).
- Copy-then-open copies synchronously inside the tap, so the copy survives the switch to the app.
- New `sharehop.lite.global.js` build without brand logos.
- `npm run check-targets` maintenance script.
- Installable from GitHub: a prebuilt release tarball, `github:timothyzhbw-jpg/sharehop#v0.2.0` (a `prepare` script builds it), and the script via jsDelivr from the tag.
- Breaking (pre-1.0): `labels.whatsapp` / `labels.email` removed (app names come from targets); `SHARE_TARGETS` and `ShareTargetId` removed (use `listShareTargets()` / `string`); `shareTargetUrl()` returns `string | null`; `ShareEnvironment` gained `ios` / `android`; `copyText()` takes an optional container.

## 0.1.0 — not published

First version.

- `<share-hop>` custom element: inline panel or Share button + dialog (bottom sheet on phones).
- Actions: copy link (with fallback), QR code with PNG download, native share sheet, WhatsApp, email.
- Custom share text via `template`; optional `utm_source` tagging per channel.
- WeChat in-app browser hint for the ··· share menu.
- English and Chinese text, `labels` overrides, CSS variables and `::part()` styling, dark mode.
- `sh-copy`, `sh-share`, `sh-qr`, `sh-download`, `sh-open`, `sh-close` events.
- React wrapper (`sharehop/react`), framework-free helpers (`sharehop`), single-file script build.
