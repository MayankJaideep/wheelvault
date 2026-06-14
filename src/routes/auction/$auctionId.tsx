import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getAuction, placeBid } from "@/lib/marketplace.functions";
import { formatINR, formatTimeLeft } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { ListingImage } from "@/components/HotWheelsPlaceholder";
import { WhatsAppOrderDialog } from "@/components/WhatsAppOrderDialog";
import { ArrowLeft, Timer, Gavel, TrendingUp, MessageCircle } from "lucide-react";

const auctionQO = (id: string) => queryOptions({ queryKey: ["auction", id], queryFn: () => getAuction({ data: id }) });

export const Route = createFileRoute("/auction/$auctionId")({
  head: () => ({ meta: [{ title: "Auction — WheelVault" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(auctionQO(params.auctionId)),
  component: AuctionPage,
  errorComponent: () => <div className="p-12 text-center text-muted-foreground">Auction not found.</div>,
  notFoundComponent: () => <div className="p-12 text-center">Auction not found.</div>,
});

function AuctionPage() {
  const { auctionId } = Route.useParams();
  const { data } = useQuery(auctionQO(auctionId));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const placeBidFn = useServerFn(placeBid);
  const [, force] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);

  useEffect(() => { const i = setInterval(() => force((n) => n + 1), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null)); }, []);
  useEffect(() => {
    const ch = supabase.channel(`auction-${auctionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `auction_id=eq.${auctionId}` }, () => qc.invalidateQueries({ queryKey: ["auction", auctionId] }))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "auctions", filter: `id=eq.${auctionId}` }, () => qc.invalidateQueries({ queryKey: ["auction", auctionId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [auctionId, qc]);

  if (!data?.auction) return <div className="p-12 text-center">Loading...</div>;
  const { auction, bids } = data;
  const l = auction.listings!;
  const minNext = auction.current_bid_cents + auction.min_increment_cents;
  const ended = auction.status !== "live" || new Date(auction.ends_at).getTime() < Date.now();
  const isWinner = ended && userId && auction.leading_bidder_id === userId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) { navigate({ to: "/auth" }); return; }
    const rupees = parseFloat(bidAmount);
    if (isNaN(rupees) || rupees <= 0) { setError("Enter a valid amount"); return; }
    setSubmitting(true);
    try {
      await placeBidFn({ data: { auction_id: auctionId, amount_cents: Math.round(rupees * 100) } });
      setBidAmount("");
      qc.invalidateQueries({ queryKey: ["auction", auctionId] });
    } catch (err: any) {
      if (err.message?.includes("Unauthorized")) { navigate({ to: "/auth" }); return; }
      setError(err.message ?? "Bid failed");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Link to="/auctions" className="inline-flex items-center gap-2 text-sm text-vault-400 hover:text-foreground mb-6"><ArrowLeft className="size-4" /> All auctions</Link>
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="aspect-square bg-vault-900 rounded-2xl overflow-hidden ring-1 ring-white/5">
          <ListingImage src={l.image_urls?.[0]} alt={l.title} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase text-primary bg-primary/15 px-2.5 py-1 rounded">{l.condition}</span>
            {l.rarity && <span className="text-xs font-semibold uppercase text-vault-200 bg-vault-800 px-2.5 py-1 rounded">{l.rarity}</span>}
          </div>
          <p className="text-sm text-vault-400 uppercase tracking-wide">{l.brand || "Hot Wheels"} {l.series ? `· ${l.series}` : ""}</p>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-1">{l.title}</h1>

          <div className="bg-gradient-to-br from-primary/15 to-vault-900 ring-1 ring-primary/30 rounded-2xl p-5 mt-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs text-vault-400 uppercase tracking-widest mb-1">Current Bid</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">{formatINR(auction.current_bid_cents)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-vault-400 uppercase tracking-widest mb-1 flex items-center gap-1 justify-end"><Timer className="size-3" /> {ended ? "Ended" : "Ends in"}</p>
                <p className="text-lg font-display font-semibold">{formatTimeLeft(auction.ends_at)}</p>
              </div>
            </div>
            {!ended && <p className="text-xs text-vault-500">Min next bid: {formatINR(minNext)}</p>}
          </div>

          {ended ? (
            isWinner ? (
              <div className="mt-6">
                <div className="bg-[#25D366]/10 ring-1 ring-[#25D366]/40 rounded-xl p-4 mb-3">
                  <p className="font-semibold text-[#25D366]">🏆 You won this auction!</p>
                  <p className="text-sm text-vault-300 mt-1">Submit your shipping details and we'll confirm payment on WhatsApp.</p>
                </div>
                <button onClick={() => setClaimOpen(true)} className="w-full bg-[#25D366] text-black font-semibold py-3 rounded-full flex items-center justify-center gap-2">
                  <MessageCircle className="size-5" /> Claim & message on WhatsApp
                </button>
              </div>
            ) : (
              <div className="bg-vault-900 ring-1 ring-white/5 rounded-xl p-5 text-center text-vault-400 mt-6">This auction has ended.</div>
            )
          ) : (
            <form onSubmit={submit} className="bg-vault-900/60 ring-1 ring-white/5 rounded-xl p-5 mt-6">
              <label className="text-xs font-semibold uppercase tracking-widest text-vault-400 mb-2 block">Your Bid (₹)</label>
              <div className="flex gap-3">
                <input type="number" min={minNext / 100} step="100" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={String(minNext / 100)}
                  className="flex-1 bg-vault-950 ring-1 ring-white/10 rounded-lg py-3 px-4 outline-none focus:ring-primary/50 text-lg font-display" />
                <button type="submit" disabled={submitting} className="bg-primary text-vault-950 font-semibold px-6 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                  <Gavel className="size-4" /> Bid
                </button>
              </div>
              {error && <p className="text-destructive text-sm mt-3">{error}</p>}
            </form>
          )}

          {l.description && <p className="text-vault-300 leading-relaxed mt-6 whitespace-pre-line">{l.description}</p>}
        </div>
      </div>

      <div className="mt-14">
        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2"><TrendingUp className="size-5 text-primary" /> Bid History ({bids.length})</h2>
        {bids.length === 0 ? <p className="text-vault-500 text-sm">No bids yet — be the first.</p> : (
          <div className="bg-vault-900/40 rounded-xl ring-1 ring-white/5 divide-y divide-white/5">
            {bids.map((b, i) => (
              <div key={b.id} className="flex justify-between items-center p-4">
                <div>
                  <p className="text-sm font-medium">Bidder {b.bidder_id.slice(0, 6)}{userId === b.bidder_id ? " (you)" : ""}</p>
                  <p className="text-xs text-vault-500">{new Date(b.created_at).toLocaleString("en-IN")}</p>
                </div>
                <p className={`font-display font-semibold ${i === 0 ? "text-primary text-lg" : "text-vault-300"}`}>{formatINR(b.amount_cents)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <WhatsAppOrderDialog
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        kind="auction_win"
        itemTitle={l.title}
        amountCents={auction.current_bid_cents}
        auctionId={auction.id}
        listingId={l.id}
        isAuthenticated={!!userId}
        itemImageUrl={l.image_urls?.[0]}
      />
    </div>
  );
}
