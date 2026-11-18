import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import jsQRModule from "jsqr";

import {
  composeShareText,
  composeShareTextWithoutUrl,
  withShareSource,
  resolveShareUrl,
} from "../src/core/text.ts";
import { shareTargetUrl } from "../src/core/targets.ts";
import { detectEnv } from "../src/core/env.ts";
import { qrMatrix, qrSvg } from "../src/core/qr.ts";
import { canNativeShare, nativeShare } from "../src/core/native.ts";
import { copyText } from "../src/core/clipboard.ts";

// jsqr is CommonJS; depending on the loader its function is the default export or `.default` of it.
const jsQR = ((jsQRModule as unknown as { default?: unknown }).default ?? jsQRModule) as unknown as typeof import("jsqr").default;

const listing = {
  url: "https://example.com/listing/27-inch-monitor",
  title: "27-inch Monitor",
  text: "$85 · pickup in New Brunswick",
};

describe("composeShareText", () => {
  test("joins title, description and link", () => {
    assert.equal(
      composeShareText(listing),
      "27-inch Monitor — $85 · pickup in New Brunswick\nhttps://example.com/listing/27-inch-monitor",
    );
  });

  test("drops missing parts instead of leaving dangling separators", () => {
    assert.equal(composeShareText({ url: listing.url, title: "Only title" }), `Only title\n${listing.url}`);
    assert.equal(composeShareText({ url: listing.url, text: "Only text" }), `Only text\n${listing.url}`);
    assert.equal(composeShareText({ url: listing.url }), listing.url);
  });

  test("collapses whitespace in user-supplied fields", () => {
    assert.equal(composeShareText({ url: "u", title: "  A \n  B  " }), "A B\nu");
  });

  test("custom template fills placeholders and removes empty lines", () => {
    const template = "Check this out: {title}\n{text}\n\n👉 {url}";
    assert.equal(
      composeShareText(listing, template),
      `Check this out: 27-inch Monitor\n$85 · pickup in New Brunswick\n👉 ${listing.url}`,
    );
    assert.equal(composeShareText({ url: "u", title: "T" }, "{title}\n{text}\n{url}"), "T\nu");
  });

  test("placeholders in values are not expanded again", () => {
    assert.equal(composeShareText({ url: "u", title: "{text}", text: "x" }, "{title}|{text}"), "{text}|x");
  });

  test("without-URL variant is used for navigator.share", () => {
    assert.equal(composeShareTextWithoutUrl(listing), "27-inch Monitor — $85 · pickup in New Brunswick");
  });
});

describe("withShareSource", () => {
  test("adds utm_source and utm_medium", () => {
    assert.equal(
      withShareSource("https://example.com/a?id=3#top", "qr"),
      "https://example.com/a?id=3&utm_source=qr&utm_medium=share#top",
    );
  });

  test("keeps existing utm values", () => {
    assert.equal(
      withShareSource("https://example.com/?utm_source=newsletter", "copy"),
      "https://example.com/?utm_source=newsletter&utm_medium=share",
    );
  });

  test("leaves invalid and non-http URLs alone", () => {
    assert.equal(withShareSource("not a url", "copy"), "not a url");
    assert.equal(withShareSource("mailto:a@example.com", "copy"), "mailto:a@example.com");
  });
});

describe("resolveShareUrl", () => {
  test("resolves relative URLs against the base", () => {
    assert.equal(resolveShareUrl("/clubs/chess", "https://example.com/x/y"), "https://example.com/clubs/chess");
  });

  test("falls back to the base when no URL is given", () => {
    assert.equal(resolveShareUrl(null, "https://example.com/page"), "https://example.com/page");
    assert.equal(resolveShareUrl("", "https://example.com/page"), "https://example.com/page");
  });

  test("rejects script and data URLs", () => {
    assert.equal(resolveShareUrl("javascript:alert(1)", "https://example.com/"), null);
    assert.equal(resolveShareUrl("data:text/html,hi", "https://example.com/"), null);
    assert.equal(resolveShareUrl(null, "about:blank"), null);
  });
});

describe("shareTargetUrl", () => {
  test("WhatsApp gets the whole message, URL-encoded", () => {
    const url = shareTargetUrl("whatsapp", listing);
    assert.ok(url.startsWith("https://wa.me/?text="));
    assert.equal(decodeURIComponent(url.slice("https://wa.me/?text=".length)), composeShareText(listing));
  });

  test("email uses title as subject and message as body", () => {
    const url = new URL(shareTargetUrl("email", { ...listing, title: "Monitor & stand?" }));
    assert.equal(url.protocol, "mailto:");
    const params = new URLSearchParams(url.search);
    assert.equal(params.get("subject"), "Monitor & stand?");
    assert.ok(params.get("body")?.endsWith(listing.url));
  });

  test("email without title has no subject", () => {
    assert.ok(!shareTargetUrl("email", { url: "https://example.com" }).includes("subject="));
  });
});

describe("detectEnv", () => {
  const ua = {
    wechatIos:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323c) NetType/WIFI Language/zh_CN",
    wechatAndroid:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.120 Mobile Safari/537.36 XWEB/1220099 MMWEBSDK/20240404 MicroMessenger/8.0.49.2600(0x28003133) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64",
    instagram:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0 (iPhone15,2; iOS 17_5; en_US)",
    safariIos:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    chromeMac:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  };

  test("WeChat on iOS and Android", () => {
    assert.deepEqual(detectEnv(ua.wechatIos), { wechat: true, inAppBrowser: true, mobile: true });
    assert.deepEqual(detectEnv(ua.wechatAndroid), { wechat: true, inAppBrowser: true, mobile: true });
  });

  test("Instagram is an in-app browser but not WeChat", () => {
    assert.deepEqual(detectEnv(ua.instagram), { wechat: false, inAppBrowser: true, mobile: true });
  });

  test("plain mobile Safari and desktop Chrome", () => {
    assert.deepEqual(detectEnv(ua.safariIos), { wechat: false, inAppBrowser: false, mobile: true });
    assert.deepEqual(detectEnv(ua.chromeMac), { wechat: false, inAppBrowser: false, mobile: false });
  });
});

describe("QR code", () => {
  // Rasterise the matrix (with quiet zone) and read it back with an independent decoder.
  function decode(text: string): string | undefined {
    const matrix = qrMatrix(text);
    const scale = 4;
    const margin = 4;
    const n = (matrix.length + margin * 2) * scale;
    const pixels = new Uint8ClampedArray(n * n * 4).fill(255);
    matrix.forEach((row, y) =>
      row.forEach((on, x) => {
        if (!on) return;
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) {
            const i = (((y + margin) * scale + dy) * n + (x + margin) * scale + dx) * 4;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
          }
      }),
    );
    return jsQR(pixels, n, n)?.data;
  }

  test("decodes back to the same URL", () => {
    assert.equal(decode(listing.url), listing.url);
  });

  test("handles long URLs with UTM tags and non-ASCII paths", () => {
    const long = withShareSource("https://example.com/社团/国际象棋俱乐部?ref=instagram-bio&lang=zh", "qr");
    assert.equal(decode(long), long);
  });

  test("SVG has a viewBox, background and modules", () => {
    const svg = qrSvg(listing.url);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (\d+) \1"/);
    assert.match(svg, /<rect [^>]*fill="#ffffff"\/>/);
    assert.match(svg, /<path d="M\d/);
  });

  test("SVG colours are escaped", () => {
    assert.ok(!qrSvg("x", { dark: '"/><script>' }).includes("<script>"));
  });
});

describe("browser APIs (stubbed navigator)", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  function setNavigator(value: unknown) {
    Object.defineProperty(globalThis, "navigator", { value, configurable: true, writable: true });
  }
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, "navigator", original);
  });

  test("nativeShare reports unsupported without navigator.share", async () => {
    setNavigator({});
    assert.equal(canNativeShare(listing), false);
    assert.equal(await nativeShare(listing), "unsupported");
  });

  test("nativeShare passes title, text and url separately", async () => {
    let received: unknown;
    setNavigator({ share: async (d: unknown) => void (received = d), canShare: () => true });
    assert.equal(canNativeShare(listing), true);
    assert.equal(await nativeShare(listing), "shared");
    assert.deepEqual(received, {
      url: listing.url,
      title: listing.title,
      text: "27-inch Monitor — $85 · pickup in New Brunswick",
    });
  });

  test("closing the share sheet is a cancel, other errors are failures", async () => {
    const reject = (name: string) => async () => {
      throw Object.assign(new Error(name), { name });
    };
    setNavigator({ share: reject("AbortError") });
    assert.equal(await nativeShare(listing), "cancelled");
    setNavigator({ share: reject("NotAllowedError") });
    assert.equal(await nativeShare(listing), "failed");
  });

  test("canNativeShare respects canShare()", () => {
    setNavigator({ share: async () => {}, canShare: () => false });
    assert.equal(canNativeShare(listing), false);
  });

  test("copyText uses the Clipboard API", async () => {
    let written = "";
    setNavigator({ clipboard: { writeText: async (t: string) => void (written = t) } });
    assert.equal(await copyText("hello"), true);
    assert.equal(written, "hello");
  });

  test("copyText falls back, and reports false when nothing can copy", async () => {
    setNavigator({ clipboard: { writeText: async () => Promise.reject(new Error("denied")) } });
    assert.equal(await copyText("hello"), false); // no document in Node → legacy path unavailable
  });
});
