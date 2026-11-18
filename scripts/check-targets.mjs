// Requests every built-in https share link once (desktop and phone user agents)
// and reports the status and where it ended up. A maintenance tool, not part
// of CI: services rate-limit, block datacenter IPs and show login walls.
// Usage: node scripts/check-targets.mjs [id ...]
import { BUILTIN_TARGETS } from "../src/core/builtin-targets.ts";
import { buildShareContext, resolveTargetHref, resolveAppScheme, isTargetAvailable } from "../src/core/targets.ts";

const UA = {
  desktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
};
const ENV = {
  desktop: { wechat: false, inAppBrowser: false, mobile: false, ios: false, android: false },
  iphone: { wechat: false, inAppBrowser: false, mobile: true, ios: true, android: false },
};
const data = { url: "https://github.com/example?ref=a&b=c", title: "Share widget test", text: "Testing a share link" };
const only = process.argv.slice(2);

for (const target of BUILTIN_TARGETS) {
  if (only.length && !only.includes(target.id)) continue;
  for (const device of ["desktop", "iphone"]) {
    const env = ENV[device];
    if (!isTargetAvailable(target, env)) continue;
    const ctx = buildShareContext(data, { env, image: "https://github.githubassets.com/favicons/favicon.png" });
    const url = resolveTargetHref(target, ctx) ?? resolveAppScheme(target.app, ctx);
    if (!url) continue;
    if (!/^https:/.test(url)) {
      console.log(`${target.id.padEnd(16)} ${device.padEnd(7)} (not https) ${url.slice(0, 90)}`);
      continue;
    }
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "user-agent": UA[device],
          accept: "text/html,application/xhtml+xml",
          "accept-language": "en-US,en;q=0.9",
          "sec-fetch-mode": "navigate",
          "sec-fetch-dest": "document",
          "upgrade-insecure-requests": "1",
        },
        signal: AbortSignal.timeout(15000),
      });
      const final = new URL(res.url);
      const lost = res.url !== url && !decodeURIComponent(res.url).includes("example") ? "  ⚠ link not in final URL" : "";
      console.log(`${target.id.padEnd(16)} ${device.padEnd(7)} ${res.status} ${final.host}${final.pathname.slice(0, 50)}${lost}`);
    } catch (error) {
      console.log(`${target.id.padEnd(16)} ${device.padEnd(7)} ERROR ${error.cause?.code ?? error.name}`);
    }
  }
}
