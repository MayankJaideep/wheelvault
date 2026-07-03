// WhatsApp checkout / inquiry helpers
export const WHATSAPP_NUMBER = "917483595994"; // +91 74835 95994 (digits only for wa.me)
export const WHATSAPP_DISPLAY = "+91 74835 95994";

export type WhatsappOrderArgs = {
  kind: "buy" | "auction_win" | "reserve";
  itemTitle: string;
  amountInr: number;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  pincode?: string;
  notes?: string;
  refId?: string;
  itemImageUrl?: string;
};

export function buildWhatsappOrderMessage(args: WhatsappOrderArgs): string {
  const header =
    args.kind === "auction_win"
      ? "🏆 Auction Win — WheelVault"
      : args.kind === "reserve"
      ? "🔒 Reservation Request — WheelVault"
      : "🛒 New Order — WheelVault";

  const lines = [
    header,
    "",
    `*Item:* ${args.itemTitle}`,
    `*Amount:* ₹${args.amountInr.toLocaleString("en-IN")}`,
    args.itemImageUrl ? `*Photo:* ${args.itemImageUrl}` : null,
    "",
    "*Buyer Details*",
    `Name: ${args.buyerName}`,
    `Phone: ${args.buyerPhone}`,
    `Address: ${args.buyerAddress}`,
    args.pincode ? `Pincode: ${args.pincode}` : null,
    args.notes ? `\nNotes: ${args.notes}` : null,
    args.refId ? `\nRef: ${args.refId}` : null,
    "",
    "Please confirm payment details (UPI / Bank) and shipping (BlueDart / DHL). Thank you!",
  ].filter(Boolean);

  return lines.join("\n");
}

export function whatsappOrderUrl(args: WhatsappOrderArgs): string {
  const message = encodeURIComponent(buildWhatsappOrderMessage(args));
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${message}`;
}
