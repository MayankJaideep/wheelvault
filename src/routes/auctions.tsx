import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getAuctions } from "@/lib/marketplace.functions";
import { formatINR, formatTimeLeft } from "@/lib/format";
import { ListingImage } from "@/components/HotWheelsPlaceholder";
import { Gavel, Timer } from "lucide-react";

const qo = queryOptions({ queryKey: ["auctions"], queryFn: () => getAuctions() });

export const Route = createFileRoute("/auctions")({
  head: () => ({ meta: [{ title: "Live Auctions — WheelVault" }, { name: "description", content: "Bid live on rare Hot Wheels and die-cast collectibles." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: AuctionsPage,
});

function AuctionsPage() {
  const { data } = useQuery(qo);
  const auctions = data?.auctions ?? [];
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((n) => n + 1), 1000); return () => clearInterval(i); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-3">
        <Gavel className="size-7 text-primary" />
        <h1 className="font-display font-extrabold text-3xl md:text-4xl">Live Auctions</h1>
      </div>
      <p className="text-vault-400">Real-time bidding. Highest bid wins.</p>

      {auctions.length === 0 ? (
        <p className="text-center text-vault-400 py-20">No live auctions right now. Check back soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {auctions.map((a) => {
            const l = a.listings!;
            return (
              <Link key={a.id} to="/auction/$auctionId" params={{ auctionId: a.id }} className="group block bg-vault-900/60 ring-1 ring-white/5 rounded-2xl overflow-hidden hover:ring-primary/40 transition-all">
                <div className="aspect-[4/3] relative">
                  <ListingImage src={l?.image_urls?.[0]} alt={l?.title ?? ""} />
                  <div className="absolute top-3 left-3 bg-primary text-vault-950 text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1">
                    <Timer className="size-3" /> {formatTimeLeft(a.ends_at)}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-vault-400 uppercase tracking-wide">{l?.brand || "Hot Wheels"}</p>
                  <p className="font-medium truncate group-hover:text-primary">{l?.title}</p>
                  <div className="mt-3">
                    <p className="text-[10px] uppercase text-vault-500 tracking-wider">Current bid</p>
                    <p className="text-primary font-display font-bold text-xl">{formatINR(a.current_bid_cents)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
