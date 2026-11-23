import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { wrapText } from "../src/core/poster.ts";
import { onShareActivity, readPageMeta } from "../src/core/analytics.ts";

// A monospace "font": every character is 10 units wide.
const measure = (text: string) => Array.from(text).length * 10;

describe("wrapText (poster titles)", () => {
  test("short text stays on one line", () => {
    assert.deepEqual(wrapText(measure, "Monitor", 200, 2), ["Monitor"]);
  });

  test("Latin text breaks at spaces", () => {
    assert.deepEqual(wrapText(measure, "Essentials Fear of God Pants", 120, 3), ["Essentials", "Fear of God", "Pants"]);
  });

  test("Chinese text wraps per character", () => {
    assert.deepEqual(wrapText(measure, "阳光两居室转租步行八分钟到校", 60, 3), ["阳光两居室转", "租步行八分钟", "到校"]);
  });

  test("text over the line limit ends with an ellipsis that fits", () => {
    const lines = wrapText(measure, "Brand new unopened authentic pants that can be worn in winter", 100, 2);
    assert.equal(lines.length, 2);
    assert.ok(lines[1]!.endsWith("…"));
    for (const line of lines) assert.ok(measure(line) <= 100, line);
  });

  test("emoji are never split", () => {
    const lines = wrapText(measure, "🎉".repeat(30), 100, 2);
    for (const line of lines) assert.doesNotThrow(() => encodeURIComponent(line));
  });

  test("a single word longer than the line is still placed", () => {
    assert.deepEqual(wrapText(measure, "Supercalifragilistic", 50, 1).length, 1);
  });
});

describe("onShareActivity", () => {
  test("normalizes every sh-* event and stops on unsubscribe", () => {
    const root = new EventTarget();
    const seen: unknown[] = [];
    const off = onShareActivity((e) => seen.push(e), { root });
    root.dispatchEvent(new CustomEvent("sh-share", { detail: { method: "wechat", url: "https://x.example/1", ok: true, result: "qr" } }));
    root.dispatchEvent(new CustomEvent("sh-copy", { detail: { method: "copy-link", url: "https://x.example/1", ok: false } }));
    root.dispatchEvent(new CustomEvent("sh-poster", { detail: { method: "poster-share", url: "https://x.example/1" } }));
    off();
    root.dispatchEvent(new CustomEvent("sh-share", { detail: { method: "x", url: "u" } }));
    assert.equal(seen.length, 3);
    const first = seen[0] as Record<string, unknown>;
    assert.equal(first.type, "share");
    assert.equal(first.channel, "wechat");
    assert.equal(first.ok, true);
    assert.equal(first.result, "qr");
    assert.equal(typeof first.timestamp, "number");
    assert.equal((seen[2] as Record<string, unknown>).type, "poster");
  });

  test("a throwing handler doesn't break the event", () => {
    const root = new EventTarget();
    onShareActivity(() => {
      throw new Error("analytics down");
    }, { root });
    assert.doesNotThrow(() => root.dispatchEvent(new CustomEvent("sh-copy", { detail: { method: "copy-link", url: "u" } })));
  });
});

describe("readPageMeta", () => {
  // Minimal stand-in for a document with RU Life-style tags.
  const tags: Record<string, string> = {
    'meta[property="og:title"]': "Essentials Fear of God Pants",
    'meta[property="og:description"]': "$70 · New · Livingston · Pickup / Delivery — Brand new, unopened.",
    'meta[property="og:image"]': "https://cdn.example/listing.jpg",
    'meta[property="og:site_name"]': "RU Life",
    'meta[property="og:url"]': "https://example.com/marketplace/abc",
  };
  const doc = {
    title: "Essentials Fear of God Pants · RU Life",
    querySelector: (sel: string) => (sel in tags ? { content: tags[sel] } : null),
  } as unknown as Document;

  test("reads Open Graph tags", () => {
    assert.deepEqual(readPageMeta(doc), {
      title: "Essentials Fear of God Pants",
      text: "$70 · New · Livingston · Pickup / Delivery — Brand new, unopened.",
      image: "https://cdn.example/listing.jpg",
      url: "https://example.com/marketplace/abc",
      siteName: "RU Life",
    });
  });

  test("falls back to <title> and returns empty without a document", () => {
    const bare = { title: "Just a title", querySelector: () => null } as unknown as Document;
    assert.equal(readPageMeta(bare).title, "Just a title");
    assert.deepEqual(readPageMeta(undefined), {});
  });
});
