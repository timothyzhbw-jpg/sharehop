// A server component page. ShareHop is a client component, so it can be
// used here directly; the custom element is only registered in the browser.
import { ShareHop } from "sharehop/react";
import { CopyCounter } from "./CopyCounter";

export default function Page() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <h1>Next.js example</h1>
      <ShareHop
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
        <ShareHop
          mode="button"
          url="https://example.com/clubs/chess-club"
          shareTitle="Chess Club"
          lang="zh"
          actions={["copy", "qr", "@china"]}
          brandColors
        />
      </p>
      <h2>Client component with event handlers</h2>
      <CopyCounter />
    </main>
  );
}
