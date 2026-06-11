import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getListings } from "@/lib/marketplace.functions";
import { formatINR } from "@/lib/format";
import { ListingImage } from "@/components/HotWheelsPlaceholder";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

const allQO = queryOptions({ queryKey: ["listings"], queryFn: () => getListings() });

export const Route = createFileRoute("/browse")({
  head: () => ({ meta: [{ title: "Browse Hot Wheels — WheelVault" }, { name: "description", content: "Browse Hot Wheels listings: treasure hunts, premium, RLC, JDM and more." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allQO),
  component: BrowsePage,
});

function BrowsePage() {
  const { data } = useQuery(allQO);
  const listings = data?.listings ?? [];
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "reserved" | "sold">("all");
  const [brand, setBrand] = useState<string>("all");

  const brands = useMemo(() => Array.from(new Set(listings.map((l) => l.brand).filter(Boolean))) as string[], [listings]);

  const filtered = listings.filter((l) => {
    if (status !== "all" && l.status !== status) return false;
    if (brand !== "all" && l.brand !== brand) return false;
    if (q && !`${l.title} ${l.brand} ${l.series}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display font-extrabold text-3xl md:text-4xl">Browse the Vault</h1>
      <p className="text-vault-400 mt-2">{listings.length} listings · curated and authenticated</p>

      <div className="mt-8 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-vault-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, brand, series…" className="w-full bg-vault-900 ring-1 ring-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-primary/50" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="bg-vault-900 ring-1 ring-white/10 rounded-full py-2.5 px-4 text-sm outline-none focus:ring-primary/50">
          <option value="all">All status</option>
          <option value="active">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="bg-vault-900 ring-1 ring-white/10 rounded-full py-2.5 px-4 text-sm outline-none focus:ring-primary/50">
          <option value="all">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-vault-400 py-20">No items match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-8">
          {filtered.map((l) => (
            <Link key={l.id} to="/listing/$listingId" params={{ listingId: l.id }} className="group">
              <div className="aspect-square bg-vault-900 rounded-xl overflow-hidden ring-1 ring-white/5 group-hover:ring-primary/40 transition-all relative">
                <ListingImage src={l.image_urls?.[0]} alt={l.title} />
                {l.status === "reserved" && <span className="absolute top-2 left-2 bg-yellow-500/90 text-vault-950 text-[10px] font-bold uppercase px-2 py-1 rounded">Reserved</span>}
                {l.status === "sold" && <span className="absolute top-2 left-2 bg-vault-700 text-white text-[10px] font-bold uppercase px-2 py-1 rounded">Sold</span>}
                {l.sale_type === "auction" && <span className="absolute top-2 right-2 bg-primary text-vault-950 text-[10px] font-bold uppercase px-2 py-1 rounded">Auction</span>}
              </div>
              <div className="mt-3">
                <p className="text-xs text-vault-400 uppercase tracking-wide truncate">{l.brand || "Hot Wheels"} · {l.series || "—"}</p>
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{l.title}</p>
                <p className="text-primary font-display font-semibold mt-0.5">{formatINR(l.price_cents)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
