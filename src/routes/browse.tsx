import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getListings, type Listing } from "@/lib/marketplace.functions";
import { Search, SlidersHorizontal, ChevronDown, ShoppingCart } from "lucide-react";

const listingsQueryOptions = queryOptions({
  queryKey: ["browse-listings"],
  queryFn: () => getListings(),
});

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse — WheelVault" },
      { name: "description", content: "Browse die-cast collectibles, Hot Wheels, RLC exclusives, and rare castings." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listingsQueryOptions),
  component: BrowsePage,
});

const CONDITIONS = ["All", "Mint", "Near Mint", "Carded", "Loose", "A+", "Grail"];
const RARITIES = ["All", "Common", "Uncommon", "Rare", "Super Treasure Hunt", "RLC Exclusive", "Prototype"];
const BRANDS = ["All", "Hot Wheels", "Matchbox", "M2 Machines", "Greenlight", "Auto World", "Johnny Lightning"];

function BrowsePage() {
  const { data } = useQuery(listingsQueryOptions);
  const listings = data?.listings ?? [];
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("All");
  const [rarity, setRarity] = useState("All");
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState("newest");

  const filtered = listings.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (condition !== "All" && l.condition !== condition) return false;
    if (rarity !== "All" && l.rarity !== rarity) return false;
    if (brand !== "All" && l.brand !== brand) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.price_cents - b.price_cents;
    if (sort === "price-desc") return b.price_cents - a.price_cents;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-display font-semibold mb-2">Browse the Vault</h1>
          <p className="text-vault-400 text-sm">{sorted.length} items available</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-vault-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search castings..."
              className="bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2 pl-10 pr-4 text-sm w-56 focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2 px-4 text-sm focus:ring-primary/50 outline-none text-foreground"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <FilterDropdown label="Condition" value={condition} options={CONDITIONS} onChange={setCondition} />
        <FilterDropdown label="Rarity" value={rarity} options={RARITIES} onChange={setRarity} />
        <FilterDropdown label="Brand" value={brand} options={BRANDS} onChange={setBrand} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sorted.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="py-24 text-center">
          <ShoppingCart className="size-12 mx-auto text-vault-700 mb-4" />
          <p className="text-vault-400">No items match your filters.</p>
        </div>
      )}
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2 pl-4 pr-10 text-sm focus:ring-primary/50 outline-none text-foreground appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o === "All" ? label : o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-vault-500 pointer-events-none" />
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const price = (listing.price_cents / 100).toFixed(2);

  return (
    <Link to="/listing/$listingId" params={{ listingId: listing.id }} className="group bg-vault-900/50 rounded-xl ring-1 ring-white/5 overflow-hidden flex flex-col hover:ring-primary/30 transition-all">
      <div className="relative">
        <div className="w-full aspect-[4/3] bg-vault-800 overflow-hidden">
          {listing.image_urls && listing.image_urls[0] ? (
            <img src={listing.image_urls[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-vault-600">
              <ShoppingCart className="size-8" />
            </div>
          )}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h3>
            <p className="text-xs text-vault-500 tracking-wide uppercase">{listing.brand ?? "Hot Wheels"} {listing.series ? `· ${listing.series}` : ""}</p>
          </div>
          <span className="text-[10px] font-semibold bg-vault-800 px-2 py-0.5 rounded text-vault-400">{listing.condition}</span>
        </div>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
          <div>
            <p className="text-[10px] text-vault-500 uppercase">Price</p>
            <p className="text-lg font-display font-medium">${price}</p>
          </div>
          <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded hover:bg-primary hover:text-vault-950 transition-all">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
