export interface ShareEnvironment {
  /** WeChat (and WeCom) in-app browser. It has no Web Share API; sharing goes through its own ··· menu. */
  wechat: boolean;
  /** Any in-app browser (WeChat, Instagram, Facebook, LINE, TikTok, …). */
  inAppBrowser: boolean;
  /** Phone or tablet user agent. iPadOS in desktop mode reports as desktop. */
  mobile: boolean;
  /** iPhone / iPad / iPod. */
  ios: boolean;
  /** Android (including HarmonyOS phones that report Android). */
  android: boolean;
}

// In-app browsers: social apps, plus Android WebViews ("; wv)") in general,
// which can't open other apps by URL scheme.
const IN_APP =
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|TikTok|musical_ly|BytedanceWebview|Weibo|QQ\/|DingTalk|KAKAOTALK|NAVER\(inapp|AlipayClient|baiduboxapp|; wv\)/i;

/** Detect the browser environment from a user agent string (defaults to navigator.userAgent). */
export function detectEnv(userAgent?: string): ShareEnvironment {
  const ua = userAgent ?? (globalThis.navigator as Navigator | undefined)?.userAgent ?? "";
  const wechat = /MicroMessenger/i.test(ua);
  return {
    wechat,
    inAppBrowser: wechat || IN_APP.test(ua),
    mobile: /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua),
    ios: /iPhone|iPad|iPod/i.test(ua),
    android: /Android/i.test(ua),
  };
}
