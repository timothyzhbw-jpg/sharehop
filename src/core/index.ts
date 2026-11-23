export type { ShareData } from "./text.ts";
export { composeShareText, composeShareTextWithoutUrl, withShareSource, resolveShareUrl } from "./text.ts";
export { copyText, copyTextSync } from "./clipboard.ts";
export type { NativeShareResult } from "./native.ts";
export { canNativeShare, nativeShare } from "./native.ts";
export type { ShareTarget, ShareContext, ShareTools, AppScheme, ShareContextOptions } from "./targets.ts";
export {
  registerShareTarget,
  unregisterShareTarget,
  onShareTargetsChange,
  getShareTarget,
  listShareTargets,
  shareTargetUrl,
  buildShareContext,
  fillTemplate,
  resolveTargetHref,
  resolveAppScheme,
  isTargetAvailable,
  targetLabel,
  expandActions,
  isWebUrl,
  PRESETS,
  RESERVED_IDS,
} from "./targets.ts";
export type { LaunchResult } from "./launch.ts";
export { launchApp } from "./launch.ts";
export type { ShareEnvironment } from "./env.ts";
export { detectEnv } from "./env.ts";
export type { PosterOptions, PosterFormat } from "./poster.ts";
export { posterBlob, posterCanvas, wrapText } from "./poster.ts";
export type { ShareActivity, ShareActivityType } from "./analytics.ts";
export { onShareActivity, readPageMeta } from "./analytics.ts";
export type { QrErrorCorrection, QrOptions } from "./qr.ts";
export { qrMatrix, qrSvg, qrPngBlob } from "./qr.ts";
