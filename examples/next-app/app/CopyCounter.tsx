"use client";

import { useState } from "react";
import { ShareWidget, type ShareTarget } from "share-panel-widget/react";

// A per-widget target (declared outside the component so its identity is stable).
const TARGETS: ShareTarget[] = [
  { id: "campusforum", label: "Campus Forum", color: "#7c3aed", href: "https://forum.example.edu/new?link={url}" },
];

// Event props (onCopy, onShare, …) need a client component.
export function CopyCounter() {
  const [events, setEvents] = useState<string[]>([]);
  return (
    <div>
      <ShareWidget
        url="https://example.com/store/jamie"
        shareTitle="Jamie's store"
        heading="Share my store"
        actions={["copy", "qr", "campusforum", "x"]}
        targets={TARGETS}
        brandColors
        labels={{ copyLink: "Copy store link" }}
        onCopy={(e) => setEvents((list) => [`copy ok=${e.detail.ok}`, ...list])}
        onQr={(e) => setEvents((list) => [`qr open=${e.detail.open}`, ...list])}
        onShare={(e) => setEvents((list) => [`share ${e.detail.method}`, ...list])}
      />
      <p id="events">{events.length ? events.join(" · ") : "no events yet"}</p>
    </div>
  );
}
