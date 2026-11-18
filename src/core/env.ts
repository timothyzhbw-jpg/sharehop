export interface ShareEnvironment {
  /** WeChat (and WeCom) in-app browser. It has no Web Share API; sharing goes through its own ··· menu. */
  wechat: boolean;
  /** Any in-app browser (WeChat, Instagram, Facebook, LINE, TikTok, …). */
  inAppBrowser: boolean;
  /** Phone or tablet user agent. iPadOS in desktop mode reports as desktop. */
  mobile: boolean;
}

const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|TikTok|musical_ly|BytedanceWebview|Weibo|QQ\/|DingTalk/i;

/** Detect the browser environment from a user agent string (defaults to navigator.userAgent). */
export function detectEnv(userAgent?: string): ShareEnvironment {
  const ua = userAgent ?? (globalThis.navigator as Navigator | undefined)?.userAgent ?? "";
  const wechat = /MicroMessenger/i.test(ua);
  return {
    wechat,
    inAppBrowser: wechat || IN_APP.test(ua),
    mobile: /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua),
  };
}
