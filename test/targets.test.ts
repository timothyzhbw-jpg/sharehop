import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  registerShareTarget,
  unregisterShareTarget,
  getShareTarget,
  listShareTargets,
  buildShareContext,
  fillTemplate,
  resolveTargetHref,
  resolveAppScheme,
  isTargetAvailable,
  expandActions,
  targetLabel,
  PRESETS,
  onShareTargetsChange,
  type ShareContext,
} from "../src/core/targets.ts";
import { BUILTIN_TARGETS } from "../src/core/builtin-targets.ts";
import type { ShareEnvironment } from "../src/core/env.ts";

const ENV: Record<string, ShareEnvironment> = {
  ios: { wechat: false, inAppBrowser: false, mobile: true, ios: true, android: false },
  android: { wechat: false, inAppBrowser: false, mobile: true, ios: false, android: true },
  desktop: { wechat: false, inAppBrowser: false, mobile: false, ios: false, android: false },
};

// A link with characters that break naive encoding: query, &, #, spaces, CJK.
const DATA = {
  url: "https://example.com/listing/27-inch?ref=a&b=c#photos",
  title: "27\" Monitor & stand — 显示器",
  text: "$85 · pickup in New Brunswick",
  image: "https://example.com/img/monitor.jpg",
};

function ctxFor(env: ShareEnvironment, data: Partial<typeof DATA> = DATA): ShareContext {
  const { image, ...rest } = { ...DATA, ...data };
  return buildShareContext(rest, { env, image });
}

describe("registry", () => {
  test("built-ins are registered and have unique ids", () => {
    const ids = BUILTIN_TARGETS.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.ok(getShareTarget(id), id);
    assert.ok(listShareTargets().length >= ids.length);
  });

  test("aliases resolve", () => {
    assert.equal(getShareTarget("twitter")?.id, "x");
    assert.equal(getShareTarget("Weixin")?.id, "wechat");
    assert.equal(getShareTarget("xhs")?.id, "xiaohongshu");
  });

  test("register adds a target and the returned function undoes it", () => {
    const undo = registerShareTarget({ id: "myforum", label: "My Forum", href: "https://forum.example/new?link={url}&t={title}" });
    const ctx = ctxFor(ENV.desktop!);
    assert.equal(
      resolveTargetHref(getShareTarget("myforum")!, ctx),
      `https://forum.example/new?link=${encodeURIComponent(DATA.url)}&t=${encodeURIComponent(DATA.title)}`,
    );
    undo();
    assert.equal(getShareTarget("myforum"), undefined);
  });

  test("overriding a built-in restores the original on undo", () => {
    const original = getShareTarget("telegram");
    const undo = registerShareTarget({ id: "telegram", label: "TG", href: "https://t.example/{url}" });
    assert.equal(getShareTarget("telegram")?.label, "TG");
    undo();
    assert.equal(getShareTarget("telegram"), original);
  });

  test("unregister removes", () => {
    registerShareTarget({ id: "temp", label: "Temp", href: "https://x.example/{url}" });
    assert.equal(unregisterShareTarget("temp"), true);
    assert.equal(unregisterShareTarget("temp"), false);
  });

  test("validation", () => {
    assert.throws(() => registerShareTarget({ id: "Bad Id", label: "x", href: "https://x" }), /lowercase/);
    assert.throws(() => registerShareTarget({ id: "copy", label: "x", href: "https://x" }), /reserved/);
    assert.throws(() => registerShareTarget({ id: "nolabel", label: "", href: "https://x" }), /label/);
    assert.throws(() => registerShareTarget({ id: "noaction", label: "x" }), /href, onSelect, copy or app/);
  });

  test("labels fall back to English, and regional tags to the base language", () => {
    const t = getShareTarget("weibo")!;
    assert.equal(targetLabel(t, "zh"), "微博");
    assert.equal(targetLabel(t, "zh-CN"), "微博");
    assert.equal(targetLabel(t, "fr"), "Weibo");
  });
});

describe("templates and safety", () => {
  test("fillTemplate encodes every placeholder, including {host}", () => {
    const ctx = ctxFor(ENV.desktop!);
    assert.equal(
      fillTemplate("u={url}&t={title}&h={host}&x={nope}", ctx),
      `u=${encodeURIComponent(DATA.url)}&t=${encodeURIComponent(DATA.title)}&h=example.com&x={nope}`,
    );
  });

  test("script URLs from a target are refused", () => {
    const ctx = ctxFor(ENV.desktop!);
    assert.equal(resolveTargetHref({ id: "evil", label: "x", href: "javascript:alert({url})" }, ctx), null);
    assert.equal(resolveTargetHref({ id: "evil", label: "x", href: () => " JavaScript:alert(1)" }, ctx), null);
    assert.equal(resolveTargetHref({ id: "evil", label: "x", href: () => "data:text/html,hi" }, ctx), null);
    assert.equal(resolveAppScheme("javascript:alert(1)", ctx), null);
  });

  test("app schemes pick the platform and fill placeholders", () => {
    const app = { ios: "a://{url}", android: "b://x", desktop: "https://c.example/" };
    assert.equal(resolveAppScheme(app, ctxFor(ENV.ios!)), `a://${encodeURIComponent(DATA.url)}`);
    assert.equal(resolveAppScheme(app, ctxFor(ENV.android!)), "b://x");
    assert.equal(resolveAppScheme(app, ctxFor(ENV.desktop!)), "https://c.example/");
    assert.equal(resolveAppScheme({ ios: "a://" }, ctxFor(ENV.desktop!)), null);
    assert.equal(resolveAppScheme({ ios: "a://", default: "d://" }, ctxFor(ENV.android!)), "d://");
  });

  test("platforms and available() hide targets", () => {
    assert.equal(isTargetAvailable({ id: "m", label: "m", href: "x:", platforms: "mobile" }, ENV.desktop!), false);
    assert.equal(isTargetAvailable({ id: "m", label: "m", href: "x:", platforms: "mobile" }, ENV.ios!), true);
    assert.equal(isTargetAvailable({ id: "d", label: "d", href: "x:", platforms: "desktop" }, ENV.android!), false);
    assert.equal(isTargetAvailable({ id: "f", label: "f", href: "x:", available: () => false }, ENV.ios!), false);
    const throws = { id: "t", label: "t", href: "x:", available: () => { throw new Error("x"); } };
    assert.equal(isTargetAvailable(throws, ENV.ios!), false);
  });

  test("presets expand and only name registered targets", () => {
    assert.deepEqual(expandActions(["copy", "@china", "native"]).slice(0, 3), ["copy", "wechat", "qq"]);
    assert.deepEqual(expandActions(["@nope", "qr"]), ["qr"]);
    for (const [name, ids] of Object.entries(PRESETS))
      for (const id of ids) assert.ok(getShareTarget(id), `preset ${name} names unknown target ${id}`);
  });
});

describe("every built-in target", () => {
  for (const target of BUILTIN_TARGETS) {
    test(target.id, () => {
      for (const [envName, env] of Object.entries(ENV)) {
        if (!isTargetAvailable(target, env)) continue;
        const ctx = ctxFor(env);
        const href = resolveTargetHref(target, ctx);
        const app = resolveAppScheme(target.app, ctx);
        assert.ok(href || app || target.copy || target.onSelect, `${target.id}/${envName} does nothing`);
        for (const url of [href, app].filter((u): u is string => !!u)) {
          assert.doesNotThrow(() => new URL(url), `${target.id}/${envName}: ${url}`);
          assert.ok(!/[\s"<>]/.test(url), `${target.id}/${envName} has unencoded characters: ${url}`);
          // Our link must survive intact: either the raw URL is gone (encoded) or not used.
          assert.ok(!url.includes("ref=a&b=c"), `${target.id}/${envName} leaks an unencoded query: ${url}`);
        }
      }
    });
  }
});

describe("target specifics", () => {
  const href = (id: string, env = ENV.desktop!, data?: Partial<typeof DATA>) =>
    resolveTargetHref(getShareTarget(id)!, ctxFor(env, data));
  const param = (url: string | null, name: string) => new URL(url ?? "").searchParams.get(name);

  test("WhatsApp, Bluesky, BAND put the whole message (with link) in one field", () => {
    for (const [id, field] of [["whatsapp", "text"], ["bluesky", "text"], ["band", "body"]] as const)
      assert.ok(param(href(id), field)?.endsWith(DATA.url), id);
  });

  test("X, Threads, Telegram, Weibo take the link separately and don't repeat it in the text", () => {
    for (const [id, textField, urlField] of [
      ["x", "text", "url"],
      ["threads", "text", "url"],
      ["telegram", "text", "url"],
      ["weibo", "title", "url"],
    ] as const) {
      const url = href(id);
      assert.equal(param(url, urlField), DATA.url, id);
      assert.ok(!param(url, textField)?.includes("example.com"), id);
    }
  });

  test("LINE switches between the app link on phones and the web plugin on computers", () => {
    assert.ok(href("line", ENV.ios)?.startsWith("https://line.me/R/share?text="));
    assert.ok(href("line", ENV.desktop)?.startsWith("https://social-plugins.line.me/lineit/share?url="));
  });

  test("SMS body syntax differs on iOS and Android", () => {
    assert.ok(href("sms", ENV.ios)?.startsWith("sms:&body="));
    assert.ok(href("sms", ENV.android)?.startsWith("sms:?body="));
  });

  test("Naver double-encodes the link and cleans the title", () => {
    const url = href("naver") ?? "";
    assert.ok(url.includes(`url=${encodeURIComponent(encodeURIComponent(DATA.url))}`));
    const title = decodeURIComponent(/title=([^&]*)/.exec(url)?.[1] ?? "");
    assert.ok(!title.includes("&") && title.includes("＆"));
    assert.ok(param(href("naver", ENV.desktop, { title: "" }), "title"), "title must never be empty");
  });

  test("Pinterest needs an image", () => {
    assert.equal(href("pinterest", ENV.desktop, { image: "" }), null);
    assert.equal(param(href("pinterest"), "media"), DATA.image);
  });

  test("Viber keeps the link inside its 200-character limit", () => {
    const long = { text: "x".repeat(400) };
    const scheme = resolveAppScheme(getShareTarget("viber")!.app, ctxFor(ENV.ios!, long)) ?? "";
    const text = decodeURIComponent(scheme.replace("viber://forward?text=", ""));
    assert.ok(text.length <= 200, `length ${text.length}`);
    assert.ok(text.endsWith(DATA.url));
  });

  test("Hacker News and Teams trim long titles", () => {
    assert.ok((param(href("hackernews", ENV.desktop, { title: "t".repeat(200) }), "t") ?? "").length <= 80);
    assert.ok((param(href("teams", ENV.desktop, { title: "t".repeat(400), text: "" }), "msgText") ?? "").length <= 200);
  });

  test("BAND and Nextdoor get the source host", () => {
    assert.equal(param(href("band"), "route"), "example.com");
    assert.equal(param(href("nextdoor"), "source"), "example.com");
  });

  test("copy-and-open apps use intent:// on Android and never on iOS", () => {
    for (const id of ["wechat", "qq", "kakaotalk", "douyin", "zhihu", "xiaohongshu", "groupme"]) {
      const t = getShareTarget(id)!;
      assert.ok(resolveAppScheme(t.app, ctxFor(ENV.android!))?.startsWith("intent://"), id);
      assert.ok(!resolveAppScheme(t.app, ctxFor(ENV.ios!))?.startsWith("intent://"), id);
    }
  });

  test("WeChat: QR on computers, ··· hint inside WeChat", () => {
    const t = getShareTarget("wechat")!;
    assert.equal(t.desktop, "qr");
    assert.equal(t.insideApp?.({ ...ENV.ios!, wechat: true, inAppBrowser: true }), true);
    assert.equal(t.insideApp?.(ENV.ios!), false);
  });

  test("webmail and Teams are desktop-only; app-only targets are mobile-only", () => {
    for (const id of ["gmail", "outlook", "teams"]) assert.equal(isTargetAvailable(getShareTarget(id)!, ENV.ios!), false, id);
    for (const id of ["sms", "xiaohongshu", "douyin", "kakaotalk", "messenger"])
      assert.equal(isTargetAvailable(getShareTarget(id)!, ENV.desktop!), false, id);
  });
});

describe("change notifications", () => {
  test("register, undo and unregister notify listeners; a stale undo is ignored", () => {
    let calls = 0;
    const off = onShareTargetsChange(() => calls++);
    const undoA = registerShareTarget({ id: "notify-me", label: "A", href: "https://a.example/{url}" });
    const undoB = registerShareTarget({ id: "notify-me", label: "B", href: "https://b.example/{url}" });
    undoA(); // A is under B: removing it must keep B
    assert.equal(getShareTarget("notify-me")?.label, "B");
    undoB(); // and A must not come back
    assert.equal(getShareTarget("notify-me"), undefined);
    undoB(); // a second undo is a no-op
    off();
    registerShareTarget({ id: "notify-me", label: "C", href: "https://c.example/{url}" });
    unregisterShareTarget("notify-me");
    assert.equal(calls, 4);
  });
});
