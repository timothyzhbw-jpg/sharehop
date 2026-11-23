export { composeShareText, composeShareTextWithoutUrl, withShareSource, resolveShareUrl } from "./text.js";
export { copyText, copyTextSync } from "./clipboard.js";
export { canNativeShare, nativeShare } from "./native.js";
export { registerShareTarget, unregisterShareTarget, onShareTargetsChange, getShareTarget, listShareTargets, shareTargetUrl, buildShareContext, fillTemplate, resolveTargetHref, resolveAppScheme, isTargetAvailable, targetLabel, expandActions, isWebUrl, PRESETS, RESERVED_IDS, } from "./targets.js";
export { launchApp } from "./launch.js";
export { detectEnv } from "./env.js";
export { posterBlob, posterCanvas, wrapText } from "./poster.js";
export { onShareActivity, readPageMeta } from "./analytics.js";
export { qrMatrix, qrSvg, qrPngBlob } from "./qr.js";
