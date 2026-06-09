import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { getListings, type Listing } from "@/lib/marketplace.functions";
import { useServerFn } from "@tanstack/react-start";
import { ShoppingCart, Heart, ArrowRight, Timer, Zap } from "lucide-react";

const listingsQueryOptions = queryOptions({
  queryKey: ["listings"],
  queryFn: () => getListings(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WheelVault — Die-Cast Marketplace" },
      { name: "description", content: "The premier global marketplace for buying and selling Hot Wheels and die-cast collectibles." },
      { property: "og:title", content: "WheelVault — Die-Cast Marketplace" },
      { property: "og:description", content: "The premier global marketplace for buying and selling Hot Wheels and die-cast collectibles." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listingsQueryOptions),
  component: HomePage,
  errorComponent: () => <div className="p-12 text-center text-muted-foreground">Failed to load</div>,
  notFoundComponent: () => <div className="p-12 text-center text-muted-foreground">Not found</div>,
});

function HomePage() {
  const { data } = useSuspenseQuery(listingsQueryOptions);
  const listings = data?.listings ?? [];

  const featured = listings.slice(0, 4);
  const auctions = listings.filter(l => l.title.toLowerCase().includes("rlc") || l.price_cents > 5000).slice(0, 4);
  const trending = listings.slice(4, 8);

  return (
    <>
      {/* Live Ticker */}
      <div className="bg-primary py-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center px-4 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-vault-950">Recently Sold: 1971 Porsche 911 ($4,250)</span>
              <span className="size-1.5 bg-vault-950 rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-wider text-vault-950">Live Bid: RLC Skyline GT-R ($890)</span>
              <span className="size-1.5 bg-vault-950 rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-wider text-vault-950">Recently Sold: Spectraflame Pink Bug ($1,100)</span>
              <span className="size-1.5 bg-vault-950 rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-wider text-vault-950">New Drop: HWC Series 5 Now Live</span>
              <span className="size-1.5 bg-vault-950 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <header className="relative py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Closing in 04:12:09
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-semibold leading-tight text-balance mb-6 italic tracking-tight">
                Special Edition <span className="text-primary">Skyline GT-R</span>
              </h1>
              <p className="text-vault-400 text-lg max-w-[48ch] text-pretty mb-10 leading-relaxed">
                A pristine RLC exclusive in Spectraflame Purple. Number 0042 of 5000. Verified vault-grade condition with original acrylic case.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/browse" className="group bg-primary text-vault-950 font-semibold py-3 px-6 rounded-md ring-1 ring-primary flex items-center gap-3 transition-transform hover:-translate-y-0.5">
                  <Zap className="size-4" />
                  <span>Enter Marketplace</span>
                </Link>
                <Link to="/sell" className="px-6 py-3 font-semibold ring-1 ring-vault-700 rounded-md hover:bg-vault-800 transition-colors">
                  Sell Your Collection
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full" />
                <div className="relative w-full aspect-square bg-vault-900 rounded-2xl ring-1 ring-white/5 grid place-items-center shadow-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1503376763036-066120622c74?w=1200&h=1200&fit=crop"
                    alt="Featured die-cast collection"
                    className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-vault-950/30" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-vault-900 ring-1 ring-white/10 p-4 rounded-lg shadow-xl">
                  <p className="text-[10px] text-vault-400 uppercase tracking-widest mb-1">Starting From</p>
                  <p className="text-xl font-display font-semibold text-primary">$89.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Live Auctions */}
      <section className="py-20 bg-vault-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-display font-semibold mb-2">Live Auctions</h2>
              <p className="text-vault-400 text-sm">Bidding ends within 24 hours.</p>
            </div>
            <Link to="/browse" search={{ auction: true } as any} className="text-sm font-semibold text-primary hover:text-orange-400 transition-colors border-b border-primary/20 pb-1">
              View all lots →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctions.map((listing) => (
              <ListingCard key={listing.id} listing={listing} showTimer />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-display font-semibold mb-2">Featured Drops</h2>
            <p className="text-vault-400 text-sm">Hand-picked by the WheelVault curation team.</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-primary hover:text-orange-400 transition-colors border-b border-primary/20 pb-1">
            Browse all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Collector Spotlight */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-vault-900 ring-1 ring-white/5 rounded-3xl p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent" />
            <div className="w-full lg:w-1/2 relative z-10">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Collector Spotlight</h3>
              <h2 className="text-4xl font-display font-semibold mb-6 leading-tight">Marcus Chen's JDM Vault</h2>
              <p className="text-vault-400 text-lg mb-8 text-pretty leading-relaxed">
                Discover how one collector curated a world-class selection of rare Japanese castings over fifteen years. Marcus shares the secrets of finding unpunched cards and the importance of spectral analysis in verification.
              </p>
              <button className="group bg-foreground text-vault-950 font-semibold py-2.5 pr-4 pl-3 rounded-md flex items-center gap-3 transition-colors hover:bg-primary">
                <span className="pl-2">Explore the collection</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] bg-vault-800 rounded-xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1558618666-fcd25a85f44e?w=600&h=800&fit=crop" alt="Collection" className="w-full h-full object-cover opacity-80" />
              </div>
              <div className="space-y-4">
                <div className="aspect-square bg-vault-800 rounded-xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1532581140115-ca43d6e5c3f6?w=600&h=600&fit=crop" alt="Detail" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square bg-vault-800 rounded-xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&h=600&fit=crop" alt="Vault" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-20 bg-vault-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-display font-semibold mb-2">Trending Now</h2>
              <p className="text-vault-400 text-sm">Most viewed items in the last 24 hours.</p>
            </div>
            <Link to="/browse" search={{ trending: true } as any} className="text-sm font-semibold text-primary hover:text-orange-400 transition-colors border-b border-primary/20 pb-1">
              See more →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trending.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ListingCard({ listing, showTimer }: { listing: Listing; showTimer?: boolean }) {
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
        {showTimer && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-vault-950/80 backdrop-blur-md rounded text-[10px] font-bold text-primary ring-1 ring-primary/30 flex items-center gap-1">
            <Timer className="size-3" />
            {String(Math.floor(Math.random() * 23)).padStart(2, "0")}:{String(Math.floor(Math.random() * 59)).padStart(2, "0")}:{String(Math.floor(Math.random() * 59)).padStart(2, "0")}
          </div>
        )}
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
            <p className="text-[10px] text-vault-500 uppercase">{showTimer ? "Current Bid" : "Price"}</p>
            <p className="text-lg font-display font-medium">${price}</p>
          </div>
          <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded hover:bg-primary hover:text-vault-950 transition-all">
            {showTimer ? "Bid" : "Buy"}
          </span>
        </div>
      </div>
    </Link>
  );
}
