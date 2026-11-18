"use client";

import { useState } from "react";
import { ShareWidget } from "share-panel-widget/react";

// Event props (onCopy, onShare, …) need a client component.
export function CopyCounter() {
  const [events, setEvents] = useState<string[]>([]);
  return (
    <div>
      <ShareWidget
        url="https://example.com/store/jamie"
        shareTitle="Jamie's store"
        heading="Share my store"
        actions={["copy", "qr"]}
        labels={{ copyLink: "Copy store link" }}
        onCopy={(e) => setEvents((list) => [`copy ok=${e.detail.ok}`, ...list])}
        onQr={(e) => setEvents((list) => [`qr open=${e.detail.open}`, ...list])}
      />
      <p id="events">{events.length ? events.join(" · ") : "no events yet"}</p>
    </div>
  );
}
