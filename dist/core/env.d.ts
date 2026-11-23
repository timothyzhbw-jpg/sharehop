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
/** Detect the browser environment from a user agent string (defaults to navigator.userAgent). */
export declare function detectEnv(userAgent?: string): ShareEnvironment;
