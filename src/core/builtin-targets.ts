import type { ShareContext, ShareTarget } from "./targets.ts";

/*
 * Built-in share targets.
 *
 * Every URL below was checked on 2026-11-18 against the service's own docs or
 * code and requested live (see docs/TARGETS.md for sources and caveats).
 * Services change these without notice — if one breaks, override it with
 * registerShareTarget({ id: "<same id>", … }) and please open an issue.
 *
 * Kinds:
 *  - href:       an https share link that pre-fills the post or message. On
 *                phones most are universal links that open the app.
 *  - copy + app: the app can't be pre-filled from the web (WeChat, Instagram,
 *                Xiaohongshu…). The widget copies the message, then opens the
 *                app so the user can paste.
 */

/** Build a URL from a base and params, leaving out empty values. */
function q(base: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return query ? `${base}${base.includes("?") ? "&" : "?"}${query}` : base;
}

/** Android intent URL: opens the app if installed, otherwise its Play Store page. */
function intent(scheme: string, pkg: string, path = ""): string {
  return `intent://${path}#Intent;scheme=${scheme};package=${pkg};end`;
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

const brandless = (ctx: ShareContext) => ctx.summary || ctx.title;

export const BUILTIN_TARGETS: readonly ShareTarget[] = [
  // ---- messaging --------------------------------------------------------
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    // Documented in WhatsApp's FAQ; universal link / App Link on phones.
    href: (ctx) => q("https://wa.me/", { text: ctx.message }),
  },
  {
    id: "telegram",
    label: { en: "Telegram", zh: "Telegram" },
    color: "#26A5E4",
    // core.telegram.org/widgets/share. `url` is required; text is shown after it.
    href: (ctx) => q("https://t.me/share/url", { url: ctx.url, text: ctx.summary }),
  },
  {
    id: "line",
    label: "LINE",
    color: "#00C300",
    // Phones: line.me/R/share opens LINE's "Share with" picker (documented URL scheme).
    // Computers: that link only redirects to line.me, so use the LINE web share plugin.
    href: (ctx) =>
      ctx.env.mobile
        ? q("https://line.me/R/share", { text: ctx.message })
        : q("https://social-plugins.line.me/lineit/share", { url: ctx.url, text: ctx.summary }),
  },
  {
    id: "sms",
    label: { en: "Messages", zh: "短信" },
    color: "#34DA50",
    platforms: "mobile",
    // No official docs for the body parameter; iOS reads "&body=", Android "?body=".
    href: (ctx) => {
      const body = encodeURIComponent(ctx.message);
      return ctx.env.ios ? `sms:&body=${body}` : ctx.env.android ? `sms:?body=${body}` : `sms:?&body=${body}`;
    },
  },
  {
    id: "email",
    label: { en: "Email", zh: "邮件" },
    color: "#6B7280",
    href: (ctx) => q("mailto:", { subject: ctx.title, body: ctx.message }),
  },
  {
    id: "messenger",
    label: "Messenger",
    color: "#0866FF",
    platforms: "mobile",
    // Undocumented app scheme (works on Android, unreliable on iOS), so copy first.
    copy: "link",
    app: {
      ios: "fb-messenger://share?link={url}",
      android: "intent://share?link={url}#Intent;scheme=fb-messenger;package=com.facebook.orca;end",
    },
  },
  {
    id: "viber",
    label: "Viber",
    color: "#7360F2",
    platforms: "mobile",
    copy: "link",
    // Documented viber://forward; Viber keeps only the first 200 characters, so the link goes last.
    app: (ctx) => {
      const room = 200 - ctx.url.length - 1;
      const text = room > 10 && ctx.summary ? `${clip(ctx.summary, room)} ${ctx.url}` : ctx.url;
      return `viber://forward?text=${encodeURIComponent(text)}`;
    },
  },
  {
    id: "kakaotalk",
    label: { en: "KakaoTalk", zh: "KakaoTalk", ko: "카카오톡" },
    color: "#FFCD00",
    platforms: "mobile",
    // Pre-filled sharing needs the Kakao JS SDK and an app key; without one, copy and open.
    copy: "message",
    app: { ios: "kakaotalk://", android: intent("kakaotalk", "com.kakao.talk") },
  },
  {
    id: "groupme",
    label: "GroupMe",
    color: "#00AFF0",
    platforms: "mobile",
    // No share endpoint at all; the scheme is from community reports.
    copy: "message",
    app: { ios: "groupme://", android: intent("groupme", "com.groupme.android") },
  },
  {
    id: "discord",
    label: "Discord",
    color: "#5865F2",
    // No share URL. Opens the DM list: universal link on phones, web client on computers.
    copy: "message",
    app: "https://discord.com/channels/@me",
  },
  {
    id: "slack",
    label: "Slack",
    color: "#4A154B",
    // Documented slack://open; also opens the Mac and Windows apps.
    copy: "message",
    app: "slack://open",
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "#FF0069",
    // No web share. Links aren't clickable in posts, so open the DM inbox (universal link).
    copy: "message",
    app: "https://www.instagram.com/direct/inbox/",
  },
  {
    id: "snapchat",
    label: "Snapchat",
    color: "#FFFC00",
    // The URL Snap's own Creative Kit Web SDK opens; preview comes from the page's og: tags.
    href: (ctx) => q("https://www.snapchat.com/scan", { attachmentUrl: ctx.url }),
  },
  {
    id: "tiktok",
    label: "TikTok",
    color: "#000000",
    copy: "message",
    app: { ios: "https://www.tiktok.com/", android: "https://www.tiktok.com/", desktop: "https://www.tiktok.com/messages" },
  },

  // ---- social -------------------------------------------------------------
  {
    id: "x",
    label: "X",
    color: "#000000",
    // docs.x.com web intent. The link is counted as 23 characters.
    href: (ctx) => q("https://x.com/intent/tweet", { text: brandless(ctx), url: ctx.url }),
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#0866FF",
    // Only `u` is honoured; text comes from the page's og: tags.
    href: (ctx) => q("https://www.facebook.com/sharer/sharer.php", { u: ctx.url }),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    // Only `url` is honoured; the preview comes from og: tags.
    href: (ctx) => q("https://www.linkedin.com/sharing/share-offsite/", { url: ctx.url }),
  },
  {
    id: "reddit",
    label: "Reddit",
    color: "#FF4500",
    href: (ctx) => q("https://www.reddit.com/submit", { url: ctx.url, title: clip(ctx.title || ctx.summary, 300) }),
  },
  {
    id: "threads",
    label: "Threads",
    color: "#000000",
    // Meta's Threads web intents; opens the app when installed.
    href: (ctx) => q("https://www.threads.com/intent/post", { text: brandless(ctx), url: ctx.url }),
  },
  {
    id: "bluesky",
    label: "Bluesky",
    color: "#1185FE",
    // No url param — the link goes inside the text.
    href: (ctx) => q("https://bsky.app/intent/compose", { text: ctx.message }),
  },
  {
    id: "pinterest",
    label: "Pinterest",
    color: "#BD081C",
    // Needs an image; the button is hidden when the widget has no `image`.
    href: (ctx) =>
      ctx.image
        ? q("https://www.pinterest.com/pin/create/button/", {
            url: ctx.url,
            media: ctx.image,
            description: clip(ctx.summary, 500),
          })
        : null,
  },
  {
    id: "tumblr",
    label: "Tumblr",
    color: "#36465D",
    href: (ctx) =>
      q("https://www.tumblr.com/widgets/share/tool", {
        canonicalUrl: ctx.url,
        posttype: "link",
        content: ctx.url,
        title: ctx.title,
        caption: ctx.text,
      }),
  },
  {
    id: "mastodon",
    label: "Mastodon",
    color: "#6364FF",
    // Mastodon has no central server. Share₂Fedi (third party) asks for the user's
    // instance once. Sites can register their own: href "https://<instance>/share?text={message}".
    href: (ctx) => q("https://s2f.kytta.dev/", { text: ctx.message }),
  },
  {
    id: "hackernews",
    label: "Hacker News",
    color: "#F0652F",
    href: (ctx) => q("https://news.ycombinator.com/submitlink", { u: ctx.url, t: clip(ctx.title || ctx.summary, 80) }),
  },
  {
    id: "vk",
    label: { en: "VK", ru: "ВКонтакте" },
    color: "#0077FF",
    href: (ctx) => q("https://vk.com/share.php", { url: ctx.url, title: ctx.title, image: ctx.image }),
  },
  {
    id: "naver",
    label: { en: "Naver", ko: "네이버" },
    color: "#03C75A",
    // Naver's bridge page re-uses the values unencoded, so the URL must be encoded twice
    // (as in Naver's own sample) and the title must not be empty or contain & or #.
    href: (ctx) => {
      const title = (ctx.title || ctx.summary || ctx.host).replace(/&/g, "＆").replace(/#/g, "＃");
      return `https://share.naver.com/web/shareView?url=${encodeURIComponent(encodeURIComponent(ctx.url))}&title=${encodeURIComponent(title)}`;
    },
  },
  {
    id: "band",
    label: { en: "BAND", ko: "밴드" },
    color: "#21C531",
    href: (ctx) => q("https://band.us/plugin/share", { body: ctx.message, route: ctx.host }),
  },
  {
    id: "hatena",
    label: { en: "Hatena", ja: "はてブ" },
    color: "#00A4DE",
    href: (ctx) => q("https://b.hatena.ne.jp/entry/panel/", { url: ctx.url }),
  },
  {
    id: "nextdoor",
    label: "Nextdoor",
    color: "#8ED500",
    href: (ctx) => q("https://nextdoor.com/sharekit/", { source: ctx.host, body: ctx.message }),
  },
  {
    id: "flipboard",
    label: "Flipboard",
    color: "#E12828",
    href: (ctx) => q("https://share.flipboard.com/bookmarklet/popout", { v: "2", url: ctx.url, title: ctx.title }),
  },

  // ---- China ----------------------------------------------------------------
  {
    id: "wechat",
    label: { en: "WeChat", zh: "微信" },
    color: "#07C160",
    // No web pre-fill without WeChat's JS-SDK. Phones: copy, then open WeChat.
    // Computers: copy and show the QR code to scan. Inside WeChat: point to the ··· menu.
    copy: "message",
    app: { ios: "weixin://", android: intent("weixin", "com.tencent.mm") },
    desktop: "qr",
    insideApp: (env) => env.wechat,
  },
  {
    id: "weibo",
    label: { en: "Weibo", zh: "微博" },
    color: "#E6162D",
    // Weibo appends the link itself, so the title is the text without it.
    href: (ctx) => q("https://service.weibo.com/share/share.php", { url: ctx.url, title: brandless(ctx), pic: ctx.image }),
  },
  {
    id: "qq",
    label: "QQ",
    color: "#1EBAFC",
    // QQ's web share page is now only a QR code; the widget's own QR does the same.
    copy: "message",
    app: { ios: "mqq://", android: intent("mqq", "com.tencent.mobileqq") },
    desktop: "qr",
  },
  {
    id: "qzone",
    label: { en: "Qzone", zh: "QQ空间" },
    color: "#FECE00",
    href: (ctx) =>
      q("https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey", {
        url: ctx.url,
        title: ctx.title,
        summary: ctx.text,
        pics: ctx.image,
      }),
  },
  {
    id: "douban",
    label: { en: "Douban", zh: "豆瓣" },
    color: "#2D963D",
    href: (ctx) =>
      q("https://www.douban.com/share/service", {
        href: ctx.url,
        name: ctx.title,
        text: ctx.text,
        sel: ctx.text,
        image: ctx.image,
      }),
  },
  {
    id: "xiaohongshu",
    label: { en: "RED", zh: "小红书" },
    color: "#FF2442",
    platforms: "mobile",
    copy: "message",
    // iOS: Xiaohongshu's own universal link (what its SDK uses); Android: app scheme.
    app: {
      ios: "https://oia.xiaohongshu.com/oia?deeplink=xhsdiscover%3A%2F%2Fhome",
      android: intent("xhsdiscover", "com.xingin.xhs", "home"),
    },
  },
  {
    id: "douyin",
    label: { en: "Douyin", zh: "抖音" },
    color: "#000000",
    platforms: "mobile",
    copy: "message",
    app: { ios: "snssdk1128://", android: intent("snssdk1128", "com.ss.android.ugc.aweme") },
  },
  {
    id: "zhihu",
    label: { en: "Zhihu", zh: "知乎" },
    color: "#0084FF",
    platforms: "mobile",
    copy: "message",
    app: { ios: "zhihu://", android: intent("zhihu", "com.zhihu.android") },
  },
  {
    id: "dingtalk",
    label: { en: "DingTalk", zh: "钉钉" },
    color: "#0089FF",
    // Opens the link inside DingTalk, where it can be forwarded (documented for the PC client).
    copy: "link",
    app: "dingtalk://dingtalkclient/page/link?url={url}&pc_slide=false",
  },

  // ---- school & work ------------------------------------------------------
  {
    id: "googleclassroom",
    label: { en: "Classroom", zh: "Google 课堂" },
    color: "#0F9D58",
    href: (ctx) => q("https://classroom.google.com/share", { url: ctx.url, title: ctx.title, body: ctx.text }),
  },
  {
    id: "teams",
    label: "Teams",
    color: "#5059C9",
    // Microsoft supports this on desktop Chrome/Edge with work or school accounts only.
    platforms: "desktop",
    href: (ctx) =>
      q("https://teams.microsoft.com/share", { href: ctx.url, msgText: clip(brandless(ctx), 200), referrer: ctx.host }),
  },
  {
    id: "gmail",
    label: "Gmail",
    color: "#EA4335",
    // Webmail compose links don't open the phone apps; phones use "email" (mailto:).
    platforms: "desktop",
    href: (ctx) => q("https://mail.google.com/mail/", { view: "cm", fs: "1", su: ctx.title, body: ctx.message }),
  },
  {
    id: "outlook",
    label: "Outlook",
    color: "#0078D4",
    // Microsoft 365 (school/work) host; outlook.live.com loses '&' in links after sign-in.
    platforms: "desktop",
    href: (ctx) => q("https://outlook.office.com/mail/deeplink/compose", { subject: ctx.title, body: ctx.message }),
  },
];
