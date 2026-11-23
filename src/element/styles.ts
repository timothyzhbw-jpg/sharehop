const light = `
  --_bg: var(--sh-bg, #ffffff);
  --_fg: var(--sh-fg, #111111);
  --_muted: var(--sh-muted, #6b6b6b);
  --_border: var(--sh-border, #e7e7e7);
  --_hover: var(--sh-hover, rgba(0, 0, 0, 0.05));
  --_accent: var(--sh-accent, #111111);
  --_on-accent: var(--sh-on-accent, #ffffff);
  --_focus: var(--sh-focus, #2563eb);
  --_success: var(--sh-success, #15803d);
  --_tile: rgba(0, 0, 0, 0.06);
`;

const dark = `
  --_bg: var(--sh-bg, #1c1c1e);
  --_fg: var(--sh-fg, #f2f2f2);
  --_muted: var(--sh-muted, #a1a1a6);
  --_border: var(--sh-border, #38383a);
  --_hover: var(--sh-hover, rgba(255, 255, 255, 0.07));
  --_accent: var(--sh-accent, #f2f2f2);
  --_on-accent: var(--sh-on-accent, #111111);
  --_focus: var(--sh-focus, #60a5fa);
  --_success: var(--sh-success, #4ade80);
  --_tile: rgba(255, 255, 255, 0.1);
`;

export const styles: string = `
:host {
  ${light}
  display: block;
  color: var(--_fg);
  font: 400 15px/1.45 var(--sh-font, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif);
  -webkit-tap-highlight-color: transparent;
}
:host([mode="button"]) { display: inline-block; }
:host([hidden]) { display: none; }
:host([theme="dark"]) { ${dark} }
@media (prefers-color-scheme: dark) {
  :host(:not([theme="light"])) { ${dark} }
}

*, *::before, *::after { box-sizing: border-box; }
button, a { font: inherit; color: inherit; }
button { background: none; border: 0; margin: 0; padding: 0; cursor: pointer; }
:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
[hidden] { display: none !important; }
svg { display: block; flex: none; }

.card {
  background: var(--_bg);
  border: var(--sh-card-border, 1px solid var(--_border));
  border-radius: var(--sh-radius, 24px);
  padding: var(--sh-card-padding, 24px);
  box-shadow: var(--sh-card-shadow, none);
}
/* appearance="plain": no card chrome, for placing the widget inside your own card or sheet. */
:host([appearance="plain"]) .card { background: transparent; border: 0; padding: 0; box-shadow: none; border-radius: 0; }
:host([appearance="plain"]) dialog .card { background: var(--_bg); padding: var(--sh-card-padding, 24px); border-radius: var(--sh-radius, 24px); }

.preview { display: flex; gap: 20px; align-items: center; }
.preview img {
  width: 108px; height: 108px; object-fit: cover; flex: none;
  border-radius: calc(var(--sh-radius, 24px) * 0.75);
  background: var(--_hover);
}
.preview p { margin: 0; }
.p-title { font-size: 20px; font-weight: 500; }
.p-subtitle { font-size: 20px; font-weight: 700; margin-top: 6px !important; }
.p-meta {
  color: var(--_muted); margin-top: 6px !important;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--sh-preview-lines, 2); overflow: hidden;
}
.divider { border: 0; border-top: 1px solid var(--_border); margin: 20px 0; }

.header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.heading { margin: 0; font-size: var(--sh-heading-size, 20px); font-weight: var(--sh-heading-weight, 600); line-height: 1.3; }
.close {
  display: grid; place-items: center; width: 44px; height: 44px; margin: -10px -10px -10px 0;
  border-radius: 999px; color: var(--_fg);
}
.close:hover { background: var(--_hover); }

.card { min-width: min(100%, 300px); }
/* As many columns as fit (about 4 on a phone, more on wide cards); a few
   buttons stretch across the full width. */
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 4px;
  margin: 16px -8px 8px;
}
.action {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  min-height: 92px; padding: 12px 4px; border-radius: 16px;
  text-decoration: none; text-align: center;
}
.action:hover { background: var(--_hover); }
.action[aria-expanded="true"] { background: var(--_hover); }
.action .icon svg { width: 28px; height: 28px; }
.tiles .action { gap: 8px; }
.tiles .icon {
  display: grid; place-items: center; width: var(--sh-tile-size, 48px); height: var(--sh-tile-size, 48px);
  border-radius: var(--sh-tile-radius, 14px);
  background: var(--sh-tile, var(--_tile)); color: var(--sh-on-tile, var(--_fg));
}
.tiles .icon svg { width: 26px; height: 26px; }
.tiles .action.is-done .icon { color: var(--_success); }
.action .label { font-size: var(--sh-label-size, 14px); line-height: 1.2; }
.action.is-done, .pill.is-done { color: var(--_success); }

.qr {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 16px; margin-bottom: 8px; border-radius: 16px; background: var(--_hover);
}
.qr-code {
  width: 200px; height: 200px; padding: 0; border-radius: 12px; overflow: hidden; background: #fff;
}
.qr-code svg { width: 100%; height: 100%; }
.qr-hint { margin: 0; color: var(--_muted); font-size: 14px; text-align: center; }

.poster {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 16px; margin-bottom: 8px; border-radius: 16px; background: var(--_hover);
}
.poster-frame {
  display: grid; place-items: center; width: min(260px, 100%); aspect-ratio: 4 / 5;
  border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}
.poster-frame[data-format="story"] { aspect-ratio: 9 / 16; width: min(200px, 100%); }
.poster-frame[data-format="square"] { aspect-ratio: 1; }
.poster-formats { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.chip {
  min-height: 32px; padding: 0 12px; border-radius: 999px; font-size: 13px;
  border: 1px solid var(--_border); background: var(--_bg); color: var(--_muted);
}
.chip[aria-pressed="true"] { background: var(--_fg); color: var(--_bg); border-color: var(--_fg); }
.poster-img { width: 100%; height: 100%; object-fit: contain; display: block; -webkit-touch-callout: default; }
.poster-loading { margin: 0; color: #6b6b6b; font-size: 14px; }
.poster-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }

.url-row {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 6px 6px 16px; border-radius: 999px;
}
.url {
  display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;
  color: var(--_muted); text-decoration: none;
  /* A long link must not set the widget's minimum width (it would overflow grid/flex columns). */
  contain: inline-size;
}
.url:hover .url-text { text-decoration: underline; }
.url-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.url svg { width: 16px; height: 16px; }

.pill {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: var(--sh-button-height, 44px); min-width: 88px; padding: 0 22px;
  border-radius: var(--sh-button-radius, 999px);
  background: var(--_accent); color: var(--_on-accent);
  font-weight: var(--sh-button-weight, 600); font-size: var(--sh-button-font-size, 16px); white-space: nowrap;
}
.pill:hover { filter: brightness(1.15); }
.pill.is-done { background: var(--_accent); color: var(--_on-accent); }
.pill.outline { background: transparent; color: var(--_fg); border: 1px solid var(--_border); }
.pill.outline:hover { background: var(--_hover); filter: none; }
.pill svg { width: 18px; height: 18px; }

.status { margin: 8px 0 0; font-size: 14px; color: var(--_muted); }
.status:empty { display: none; }
/* Success messages are for screen readers only; the button already says "Copied!". */
.status.sr-only {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}
.empty { margin: 0; color: var(--_muted); }

/* button mode */
.trigger {
  display: inline-flex; align-items: center; gap: 8px; min-height: var(--sh-button-height, 44px); padding: 0 18px;
  border: var(--sh-trigger-border, 1px solid var(--_border)); border-radius: var(--sh-button-radius, 999px);
  background: var(--sh-trigger-bg, var(--_bg)); color: var(--sh-trigger-fg, var(--_fg));
  font-weight: var(--sh-button-weight, 600); font-size: var(--sh-trigger-font-size, inherit);
}
.trigger:hover { background: var(--sh-trigger-hover, var(--_hover)); }
.trigger svg { width: 20px; height: 20px; }
dialog {
  padding: 0; border: 0; background: transparent; color: inherit;
  width: min(560px, calc(100vw - 32px)); max-width: none; max-height: calc(100dvh - 32px); overflow: auto;
}
dialog::backdrop { background: var(--sh-backdrop, rgba(0, 0, 0, 0.45)); }
dialog .card { box-shadow: var(--sh-dialog-shadow, 0 24px 64px rgba(0, 0, 0, 0.25)); }

/* WeChat / ··· menu hint: a modal <dialog>, so it is in the top layer above everything. */
dialog.wx-hint {
  position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none;
  margin: 0; border: 0; border-radius: 0; overflow: hidden;
  padding: 12px 20px 20px; background: rgba(0, 0, 0, 0.82); color: #fff; text-align: right;
}
dialog.wx-hint[open] { display: flex; flex-direction: column; align-items: flex-end; gap: 16px; }
dialog.wx-hint::backdrop { background: transparent; }
.wx-hint p { margin: 0; max-width: 300px; font-size: 18px; line-height: 1.5; }
.wx-hint .pill { background: #fff; color: #111; margin-top: 8px; }

@media (max-width: 640px) {
  dialog:not(.wx-hint) { width: 100vw; margin: auto 0 0; max-height: 90dvh; }
  dialog .card {
    border-radius: var(--sh-radius, 24px) var(--sh-radius, 24px) 0 0; border-bottom: 0;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  }
}
@media (max-width: 480px) {
  .card { padding: 18px; }
  .preview { gap: 14px; }
  .preview img { width: 84px; height: 84px; }
  .p-title, .p-subtitle { font-size: 17px; }
  .heading { font-size: 18px; }
  .actions { margin-inline: -6px; }
  .action { min-height: 84px; gap: 8px; }
  .action .label { font-size: 13px; }
  .url-row { padding-left: 8px; }
  .pill { min-width: 76px; padding: 0 18px; }
}
@media (prefers-reduced-motion: no-preference) {
  .action, .pill, .close, .trigger { transition: background-color 0.15s, color 0.15s; }
}
`;
