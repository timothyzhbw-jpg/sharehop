// Builds dist/share-widget.global.js: one minified file for <script> tags,
// with uqr bundled in. The ESM build (for bundlers) comes from tsc.
import { build } from "esbuild";

await build({
  entryPoints: [new URL("../src/global.ts", import.meta.url).pathname],
  outfile: new URL("../dist/share-widget.global.js", import.meta.url).pathname,
  bundle: true,
  format: "iife",
  globalName: "ShareWidget",
  minify: true,
  target: ["es2022", "safari15.4"],
  legalComments: "eof",
  banner: { js: "/*! share-panel-widget | MIT | includes uqr (MIT) */" },
});
