import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createInquiry } from "@/lib/marketplace.functions";
import { whatsappOrderUrl } from "@/lib/whatsapp";
import { MessageCircle, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  itemTitle: string;
  amountCents: number;
  kind: "buy" | "auction_win" | "reserve";
  listingId?: string;
  auctionId?: string;
  isAuthenticated: boolean;
  itemImageUrl?: string;
};

export function WhatsAppOrderDialog(props: Props) {
  const create = useServerFn(createInquiry);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!props.open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Name, phone and address are required");
      return;
    }
    const fallbackRef = `${props.kind}-${Date.now().toString(36)}`;
    const immediateUrl = whatsappOrderUrl({
      kind: props.kind,
      itemTitle: props.itemTitle,
      amountInr: Math.round(props.amountCents / 100),
      buyerName: name.trim(),
      buyerPhone: phone.trim(),
      buyerAddress: address.trim(),
      pincode: pincode.trim(),
      notes: notes.trim(),
      refId: fallbackRef,
      itemImageUrl: props.itemImageUrl,
    });
    const pendingWindow = window.open(immediateUrl, "_blank", "noopener,noreferrer");
    setSubmitting(true);
    try {
      const { inquiry } = await create({
        data: {
          listing_id: props.listingId,
          auction_id: props.auctionId,
          kind: props.kind,
          buyer_name: name.trim(),
          buyer_phone: phone.trim(),
          buyer_address: address.trim(),
          buyer_pincode: pincode.trim() || undefined,
          amount_cents: props.amountCents,
          notes: notes.trim() || undefined,
        },
      });
      const confirmedUrl = whatsappOrderUrl({
        kind: props.kind,
        itemTitle: props.itemTitle,
        amountInr: Math.round(props.amountCents / 100),
        buyerName: name.trim(),
        buyerPhone: phone.trim(),
        buyerAddress: address.trim(),
        pincode: pincode.trim(),
        notes: notes.trim(),
        refId: inquiry.id.slice(0, 8),
        itemImageUrl: props.itemImageUrl,
      });
      if (pendingWindow && !pendingWindow.closed) pendingWindow.location.href = confirmedUrl;
      else window.location.href = confirmedUrl;
      props.onClose();
    } catch (err: any) {
      if (!pendingWindow || pendingWindow.closed) window.location.href = immediateUrl;
      props.onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    props.kind === "auction_win" ? "Claim your win" : props.kind === "reserve" ? "Reserve this item" : "Confirm your order";

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={props.onClose}>
      <div className="bg-vault-950 ring-1 ring-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-vault-950">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          <button onClick={props.onClose} className="text-vault-400 hover:text-foreground"><X className="size-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-vault-900/60 rounded-lg p-3 ring-1 ring-white/5">
            <p className="text-xs text-vault-400 uppercase tracking-wider">Item</p>
            <p className="font-medium text-sm mt-0.5 truncate">{props.itemTitle}</p>
            <p className="text-primary font-display font-semibold mt-1">₹{(props.amountCents / 100).toLocaleString("en-IN")}</p>
          </div>

          <Field label="Full name" required value={name} onChange={setName} placeholder="Rahul Sharma" />
          <Field label="Phone (with country code)" required value={phone} onChange={setPhone} placeholder="+91 9876543210" type="tel" />
          <Field label="Delivery address" required value={address} onChange={setAddress} placeholder="House, street, city, state" textarea />
          <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="560001" />
          <Field label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Anything else?" textarea />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#25D366] text-black font-semibold py-3 rounded-lg hover:bg-[#1ebe5b] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <MessageCircle className="size-5" />
            {submitting ? "Submitting…" : "Send via WhatsApp"}
          </button>
          <p className="text-[11px] text-vault-500 text-center">
            No login is required. We'll save your details and open WhatsApp with a pre-filled order message for the seller. Payment & shipping are confirmed there.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-vault-400 font-semibold">
        {label}{required && <span className="text-primary"> *</span>}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="mt-1.5 w-full bg-vault-900 ring-1 ring-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-primary/50"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 w-full bg-vault-900 ring-1 ring-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-primary/50"
        />
      )}
    </label>
  );
}
