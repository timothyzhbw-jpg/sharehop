// Entry for the <script> build (dist/share-widget.global.js): registers
// <share-widget> and exposes the helpers as window.ShareWidget.
export * from "./core/index.ts";
export { ShareWidgetElement, defineShareWidget, LABELS } from "./element/index.ts";
import { defineShareWidget } from "./element/index.ts";

defineShareWidget();
