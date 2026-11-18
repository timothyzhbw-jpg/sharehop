import type { ReactNode } from "react";

export const metadata = { title: "share-widget · Next.js example" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f6f6f4", fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
