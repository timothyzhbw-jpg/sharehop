export interface ShareWidgetLabels {
  /** Trigger button text in button mode. */
  share: string;
  /** Panel heading when no `heading` attribute is set. */
  heading: string;
  copyLink: string;
  qr: string;
  more: string;
  /** Text of the pill button in the link row. */
  copy: string;
  /** Shown on a copy button for two seconds after copying. */
  copied: string;
  /** Announced to screen readers after copying. */
  linkCopied: string;
  copyFailed: string;
  shareFailed: string;
  openLink: string;
  close: string;
  scanHint: string;
  download: string;
  qrAlt: string;
  wechatHint: string;
  gotIt: string;
  noUrl: string;
  /** App hand-off messages; {app} is replaced by the app's name. */
  copiedOpening: string;
  opening: string;
  appNotOpened: string;
  appNotOpenedCopied: string;
  copiedPaste: string;
  copiedScan: string;
  scanWith: string;
  menuHint: string;
}

export type ShareWidgetLang = "en" | "zh";

export const LABELS: Record<ShareWidgetLang, ShareWidgetLabels> = {
  en: {
    share: "Share",
    heading: "Share",
    copyLink: "Copy link",
    qr: "QR Code",
    more: "More",
    copy: "Copy",
    copied: "Copied!",
    linkCopied: "Link copied",
    copyFailed: "Couldn't copy automatically — select the link and copy it.",
    shareFailed: "This browser can't open the share menu. Use Copy link instead.",
    openLink: "Open link in a new tab",
    close: "Close",
    scanHint: "Scan with a phone camera or WeChat",
    download: "Download PNG",
    qrAlt: "QR code for this link",
    wechatHint: "Tap ··· in the top-right corner, then choose Send to Chat or Share to Moments.",
    gotIt: "Got it",
    noUrl: "There is no link to share on this page.",
    copiedOpening: "Link copied — opening {app}…",
    opening: "Opening {app}…",
    appNotOpened: "Couldn't open {app}. Is it installed?",
    appNotOpenedCopied: "Couldn't open {app}. The link is copied — open {app} and paste it.",
    copiedPaste: "Link copied — paste it in {app}.",
    copiedScan: "Link copied. To send it from your phone, scan the QR code with {app}.",
    scanWith: "Scan the QR code with {app} on your phone.",
    menuHint: "Tap ··· in the top-right corner to share in {app}.",
  },
  zh: {
    share: "分享",
    heading: "分享",
    copyLink: "复制链接",
    qr: "二维码",
    more: "更多",
    copy: "复制",
    copied: "已复制！",
    linkCopied: "链接已复制",
    copyFailed: "没能自动复制，请选中链接后手动复制。",
    shareFailed: "这个浏览器打不开系统分享菜单，请改用「复制链接」。",
    openLink: "在新标签页打开链接",
    close: "关闭",
    scanHint: "用手机相机或微信扫一扫",
    download: "下载 PNG",
    qrAlt: "此链接的二维码",
    wechatHint: "点右上角 ···，选择「发送给朋友」或「分享到朋友圈」。",
    gotIt: "知道了",
    noUrl: "这个页面没有可以分享的链接。",
    copiedOpening: "链接已复制，正在打开{app}…",
    opening: "正在打开{app}…",
    appNotOpened: "没能打开{app}，可能没有安装。",
    appNotOpenedCopied: "没能打开{app}。链接已复制，打开{app}后粘贴即可。",
    copiedPaste: "链接已复制，去{app}里粘贴即可。",
    copiedScan: "链接已复制。也可以用手机{app}扫描二维码发送。",
    scanWith: "用手机{app}扫描二维码即可分享。",
    menuHint: "点右上角 ··· 即可分享到{app}。",
  },
};

export function resolveLang(value: string | null | undefined): ShareWidgetLang {
  return value && /^zh\b/i.test(value) ? "zh" : "en";
}
