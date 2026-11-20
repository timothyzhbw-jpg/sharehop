// Entry for the <script> build (dist/sharehop.global.js): registers
// <share-hop> and exposes the helpers as window.ShareHop.
export * from "./core/index.ts";
export { ShareHopElement, defineShareHop, LABELS } from "./element/index.ts";
import { defineShareHop } from "./element/index.ts";

defineShareHop();
