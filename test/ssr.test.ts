import { test } from "node:test";
import assert from "node:assert/strict";

// Next.js and other SSR frameworks import components on the server, where
// HTMLElement and customElements do not exist. Importing must not throw.
test("element and define entries import cleanly without a DOM", async () => {
  assert.equal(typeof (globalThis as { HTMLElement?: unknown }).HTMLElement, "undefined");
  const element = await import("../src/element/index.ts");
  assert.equal(typeof element.ShareHopElement, "function");
  assert.doesNotThrow(() => element.defineShareHop());
  await import("../src/element/define.ts");
});

test("labels exist for every key in both languages", async () => {
  const { LABELS, resolveLang } = await import("../src/element/labels.ts");
  assert.deepEqual(Object.keys(LABELS.zh).sort(), Object.keys(LABELS.en).sort());
  assert.equal(resolveLang("zh-CN"), "zh");
  assert.equal(resolveLang("zh-Hant-TW"), "zh");
  assert.equal(resolveLang("en-US"), "en");
  assert.equal(resolveLang(null), "en");
});
