// Builds the single-file <script> bundles (uqr included):
//   dist/sharehop.global.js       — with brand logos
//   dist/sharehop.lite.global.js  — letter icons instead of logos (much smaller)
// The ESM build (for bundlers) comes from tsc.
import { build } from "esbuild";

const entry = new URL("../src/global.ts", import.meta.url).pathname;
const common = {
  entryPoints: [entry],
  bundle: true,
  format: "iife",
  globalName: "ShareHop",
  minify: true,
  target: ["es2022", "safari15.4"],
  legalComments: "eof",
};

await build({
  ...common,
  outfile: new URL("../dist/sharehop.global.js", import.meta.url).pathname,
  banner: { js: "/*! sharehop | MIT | includes uqr (MIT) and simple-icons paths (CC0-1.0); brand logos are trademarks of their owners */" },
});

const noLogos = {
  name: "no-logos",
  setup(b) {
    b.onResolve({ filter: /brand-icons\.ts$/ }, () => ({ path: "brand-icons-stub", namespace: "stub" }));
    b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      contents: "export function brandIcon() { return undefined; }",
      loader: "js",
    }));
  },
};

await build({
  ...common,
  outfile: new URL("../dist/sharehop.lite.global.js", import.meta.url).pathname,
  banner: { js: "/*! sharehop (lite) | MIT | includes uqr (MIT) */" },
  plugins: [noLogos],
});
