# Changelog

## 0.1.0 — unreleased

First version.

- `<share-widget>` custom element: inline panel or Share button + dialog (bottom sheet on phones).
- Actions: copy link (with fallback), QR code with PNG download, native share sheet, WhatsApp, email.
- Custom share text via `template`; optional `utm_source` tagging per channel.
- WeChat in-app browser hint for the ··· share menu.
- English and Chinese text, `labels` overrides, CSS variables and `::part()` styling, dark mode.
- `sw-copy`, `sw-share`, `sw-qr`, `sw-download`, `sw-open`, `sw-close` events.
- React wrapper (`share-panel-widget/react`), framework-free helpers (`share-panel-widget`), single-file script build.
