// A server component page. ShareWidget is a client component, so it can be
// used here directly; the custom element is only registered in the browser.
import { ShareWidget } from "share-panel-widget/react";
import { CopyCounter } from "./CopyCounter";

export default function Page() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <h1>Next.js example</h1>
      <ShareWidget
        url="https://example.com/marketplace/27-inch-monitor"
        shareTitle="27-inch Monitor"
        shareText="$85 · pickup in New Brunswick"
        heading="Share this listing"
        previewTitle="27-inch Monitor"
        previewSubtitle="$85"
        previewMeta="Campus Marketplace · New Brunswick, NJ"
        utm
      />
      <p style={{ marginTop: 32 }}>
        Button mode in a header:{" "}
        <ShareWidget mode="button" url="https://example.com/clubs/chess-club" shareTitle="Chess Club" lang="zh" />
      </p>
      <h2>Client component with event handlers</h2>
      <CopyCounter />
    </main>
  );
}
