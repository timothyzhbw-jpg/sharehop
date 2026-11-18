import type { ShareData } from "./text.ts";
import { composeShareText } from "./text.ts";

/** Share targets that open a URL. More (Facebook, X, Telegram…) come in a later version. */
export type ShareTargetId = "whatsapp" | "email";

export const SHARE_TARGETS: readonly ShareTargetId[] = ["whatsapp", "email"];

/**
 * Build the URL that opens a share target with the message pre-filled.
 * WhatsApp gets the full message (title, description and link) because it
 * only takes one text field; email gets the title as subject.
 */
export function shareTargetUrl(id: ShareTargetId, data: ShareData, template?: string): string {
  const message = composeShareText(data, template);
  switch (id) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(message)}`;
    case "email": {
      const params = [`body=${encodeURIComponent(message)}`];
      if (data.title) params.unshift(`subject=${encodeURIComponent(data.title)}`);
      return `mailto:?${params.join("&")}`;
    }
  }
}
