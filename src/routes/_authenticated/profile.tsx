import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getMyProfile, getMyInquiries } from "@/lib/marketplace.functions";
import { formatINR } from "@/lib/format";
import { Shield, MessageCircle } from "lucide-react";

const profileQO = queryOptions({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
const inqQO = queryOptions({ queryKey: ["my-inquiries"], queryFn: () => getMyInquiries() });

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — WheelVault" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: p } = useQuery(profileQO);
  const { data: inq } = useQuery(inqQO);
  const inquiries = inq?.inquiries ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display font-extrabold text-3xl">My Account</h1>
      <p className="text-vault-400 mt-1">Welcome back, {p?.profile?.display_name ?? "Collector"}.</p>

      {p?.isAdmin && (
        <Link to="/_authenticated/admin" className="mt-6 inline-flex items-center gap-2 bg-primary/15 text-primary px-4 py-2 rounded-full ring-1 ring-primary/30 font-semibold text-sm">
          <Shield className="size-4" /> Open Admin Dashboard
        </Link>
      )}

      <h2 className="font-display font-bold text-xl mt-12 mb-4">My Orders & Bids</h2>
      {inquiries.length === 0 ? (
        <p className="text-vault-400 text-sm">No orders or bids yet. <Link to="/browse" className="text-primary">Browse the vault</Link>.</p>
      ) : (
        <div className="space-y-3">
          {inquiries.map((i) => (
            <div key={i.id} className="bg-vault-900/60 ring-1 ring-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-vault-400">{i.kind.replace("_", " ")} · {new Date(i.created_at).toLocaleString("en-IN")}</p>
                <p className="font-medium mt-0.5">{i.buyer_name} — {i.buyer_phone}</p>
                <p className="text-xs text-vault-400 truncate max-w-md">{i.buyer_address}</p>
              </div>
              <div className="text-right">
                {i.amount_cents && <p className="text-primary font-display font-semibold">{formatINR(i.amount_cents)}</p>}
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${i.status === "new" ? "text-yellow-400" : "text-vault-300"}`}>{i.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-vault-900/60 ring-1 ring-white/5 rounded-xl p-5 flex items-center gap-4">
        <MessageCircle className="size-6 text-[#25D366] shrink-0" />
        <div className="text-sm text-vault-300">
          Questions about an order or shipment? <a href="https://wa.me/917483595994" target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-semibold">WhatsApp +91 74835 95994</a>
        </div>
      </div>
    </div>
  );
}
