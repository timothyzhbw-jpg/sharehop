# Changelog

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
