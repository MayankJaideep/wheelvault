import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getAuction, placeBid, getAuctions, type Auction } from "@/lib/marketplace.functions";
import { formatINR, formatTimeLeft } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Timer, ArrowLeft, Gavel, TrendingUp } from "lucide-react";

const auctionsQO = queryOptions({ queryKey: ["auctions"], queryFn: () => getAuctions() });

export const Route = createFileRoute("/auctions")({
  head: () => ({ meta: [{ title: "Live Auctions — WheelVault" }, { name: "description", content: "Live Hot Wheels auctions on WheelVault." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(auctionsQO),
  component: AuctionsPage,
});

function AuctionsPage() {
  const { data } = useQuery(auctionsQO);
  const auctions = data?.auctions ?? [];
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase.channel("auctions-live").on("postgres_changes", { event: "UPDATE", schema: "public", table: "auctions" }, () => {
      qc.invalidateQueries({ queryKey: ["auctions"] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-semibold mb-2 flex items-center gap-3"><Gavel className="text-primary" /> Live Auctions</h1>
        <p className="text-vault-400">{auctions.length} active lots — bid before the timer hits zero.</p>
      </div>
      {auctions.length === 0 ? (
        <div className="py-24 text-center text-vault-400">No live auctions right now.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((a) => <AuctionCard key={a.id} auction={a} />)}
        </div>
      )}
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((n) => n + 1), 1000); return () => clearInterval(i); }, []);
  const l = auction.listings;
  return (
    <Link to="/auction/$auctionId" params={{ auctionId: auction.id }} className="group bg-vault-900/60 rounded-2xl ring-1 ring-white/5 overflow-hidden hover:ring-primary/40 transition-all">
      <div className="relative w-full aspect-[4/3] bg-vault-800 overflow-hidden">
        {l?.image_urls?.[0] && <img src={l.image_urls[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-vault-950/90 backdrop-blur-md rounded text-xs font-bold text-primary ring-1 ring-primary/40 flex items-center gap-1.5">
          <Timer className="size-3.5" /> {formatTimeLeft(auction.ends_at)}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{l?.title}</h3>
        <p className="text-xs text-vault-500 uppercase tracking-wide mb-4">{l?.brand} {l?.series ? `· ${l.series}` : ""}</p>
        <div className="flex items-end justify-between pt-4 border-t border-white/5">
          <div>
            <p className="text-[10px] text-vault-500 uppercase mb-1">Current Bid</p>
            <p className="text-2xl font-display font-semibold text-primary">{formatINR(auction.current_bid_cents)}</p>
          </div>
          <span className="bg-primary text-vault-950 font-semibold px-4 py-2 rounded text-sm">Place Bid</span>
        </div>
      </div>
    </Link>
  );
}
