// In-app browsers: social apps, plus Android WebViews ("; wv)") in general,
// which can't open other apps by URL scheme.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|TikTok|musical_ly|BytedanceWebview|Weibo|QQ\/|DingTalk|KAKAOTALK|NAVER\(inapp|AlipayClient|baiduboxapp|; wv\)/i;
/** Detect the browser environment from a user agent string (defaults to navigator.userAgent). */
export function detectEnv(userAgent) {
    const ua = userAgent ?? globalThis.navigator?.userAgent ?? "";
    const wechat = /MicroMessenger/i.test(ua);
    return {
        wechat,
        inAppBrowser: wechat || IN_APP.test(ua),
        mobile: /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua),
        ios: /iPhone|iPad|iPod/i.test(ua),
        android: /Android/i.test(ua),
    };
}
