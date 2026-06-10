import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getListings, getAuctions, type Listing, type Auction } from "@/lib/marketplace.functions";
import { formatINR, formatTimeLeft } from "@/lib/format";
import { ShoppingCart, ArrowRight, Timer, Zap, ShieldCheck, Trophy, Sparkles } from "lucide-react";

const listingsQO = queryOptions({ queryKey: ["listings"], queryFn: () => getListings() });
const auctionsQO = queryOptions({ queryKey: ["auctions"], queryFn: () => getAuctions() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WheelVault — India's Hot Wheels & Die-Cast Marketplace" },
      { name: "description", content: "Buy, sell, trade and bid on rare Hot Wheels and die-cast collectibles. Verified sellers. INR pricing. Pan-India shipping." },
      { property: "og:title", content: "WheelVault — India's Hot Wheels Marketplace" },
      { property: "og:description", content: "Buy, sell, and auction rare Hot Wheels in India. Verified, insured, vault-grade." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=1200&h=630&fit=crop" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(listingsQO),
      context.queryClient.ensureQueryData(auctionsQO),
    ]);
  },
  component: HomePage,
  errorComponent: () => <div className="p-12 text-center text-muted-foreground">Failed to load. Please refresh.</div>,
  notFoundComponent: () => <div className="p-12 text-center text-muted-foreground">Not found</div>,
});

function HomePage() {
  const { data: lData } = useSuspenseQuery(listingsQO);
  const { data: aData } = useSuspenseQuery(auctionsQO);
  const listings = lData?.listings ?? [];
  const auctions = aData?.auctions ?? [];

  const featured = listings.slice(0, 4);
  const trending = listings.slice(4, 8);
  const hero = listings[0];

  return (
    <>
      <LiveTicker />

      {/* HERO */}
      <header className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.65_0.2_45/_0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                {auctions.length} live auctions · India
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-semibold leading-[1.05] text-balance mb-6 tracking-tight">
                India's home for <span className="text-primary italic">Hot Wheels</span> & die-cast.
              </h1>
              <p className="text-vault-400 text-lg max-w-[52ch] text-pretty mb-10 leading-relaxed">
                Buy instantly, place bids in real-time, or list your own collection. Verified condition, insured shipping, secure payments — all priced in rupees.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/browse" className="group bg-primary text-vault-950 font-semibold py-3 px-6 rounded-md ring-1 ring-primary flex items-center gap-3 transition-transform hover:-translate-y-0.5">
                  <Zap className="size-4" />
                  <span>Enter Marketplace</span>
                </Link>
                <Link to="/auctions" className="px-6 py-3 font-semibold ring-1 ring-vault-700 rounded-md hover:bg-vault-800 transition-colors flex items-center gap-2">
                  <Timer className="size-4 text-primary" />
                  Live Auctions
                </Link>
                <Link to="/sell" className="px-6 py-3 font-semibold text-vault-400 hover:text-foreground transition-colors">
                  Sell your collection →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-12 pt-10 border-t border-white/5 max-w-lg">
                <Stat label="Listings" value={listings.length.toString()} />
                <Stat label="Live Auctions" value={auctions.length.toString()} />
                <Stat label="Verified" value="100%" />
              </div>
            </div>

            <div className="lg:col-span-5">
              <HeroCard listing={hero} />
            </div>
          </div>
        </div>
      </header>

      {/* LIVE AUCTIONS */}
      {auctions.length > 0 && (
        <section className="py-20 bg-vault-900/30">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeader title="Live Auctions" subtitle="Bid in real-time before the timer ends." link="/auctions" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctions.slice(0, 4).map((a) => <AuctionCard key={a.id} auction={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <SectionHeader title="Featured Drops" subtitle="Hand-picked by the WheelVault curation team." link="/browse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="py-16 bg-vault-900/30">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          <ValueCard icon={ShieldCheck} title="Verified Authenticity" desc="Every premium listing is condition-graded before going live." />
          <ValueCard icon={Trophy} title="Live Bidding" desc="Real-time auction updates so you never miss a chance at a grail." />
          <ValueCard icon={Sparkles} title="INR Pricing, India Shipping" desc="Pay in rupees with insured, tracked shipping nationwide." />
        </div>
      </section>

      {/* TRENDING */}
      {trending.length > 0 && (
        <section className="py-24 max-w-7xl mx-auto px-6">
          <SectionHeader title="Trending Now" subtitle="Most-viewed castings in the last 24 hours." link="/browse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trending.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-primary/20 via-vault-900 to-vault-900 ring-1 ring-primary/20 rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-display font-semibold mb-4">Got a vault of your own?</h2>
            <p className="text-vault-300 max-w-xl mx-auto mb-8">List your Hot Wheels or die-cast pieces in minutes. Reach collectors across India and get paid securely.</p>
            <Link to="/sell" className="inline-flex items-center gap-2 bg-primary text-vault-950 font-semibold px-6 py-3 rounded-md hover:bg-primary/90 transition-all">
              Start selling <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function LiveTicker() {
  return (
    <div className="bg-primary py-2 overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-8 items-center px-4 shrink-0">
            <TickerItem text="SOLD · 1971 Porsche 911 — ₹4,25,000" />
            <TickerItem text="LIVE BID · RLC Skyline GT-R — ₹89,000" />
            <TickerItem text="SOLD · Spectraflame Pink Bug — ₹1,10,000" />
            <TickerItem text="NEW DROP · HWC Series 5 Now Live" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TickerItem({ text }: { text: string }) {
  return (
    <>
      <span className="text-xs font-semibold uppercase tracking-wider text-vault-950">{text}</span>
      <span className="size-1.5 bg-vault-950 rounded-full" />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl md:text-3xl font-display font-semibold text-primary">{value}</p>
      <p className="text-xs text-vault-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, link }: { title: string; subtitle: string; link: string }) {
  return (
    <div className="flex items-end justify-between mb-12">
      <div>
        <h2 className="text-3xl font-display font-semibold mb-2">{title}</h2>
        <p className="text-vault-400 text-sm">{subtitle}</p>
      </div>
      <Link to={link as any} className="text-sm font-semibold text-primary hover:text-orange-400 transition-colors border-b border-primary/20 pb-1">
        View all →
      </Link>
    </div>
  );
}

function HeroCard({ listing }: { listing?: Listing }) {
  const image = listing?.image_urls?.[0] ?? "https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=1200&h=1200&fit=crop";
  return (
    <div className="relative group">
      <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full" />
      <div className="relative w-full aspect-square bg-vault-900 rounded-2xl ring-1 ring-white/5 grid place-items-center shadow-2xl overflow-hidden">
        <img src={image} alt={listing?.title ?? "Featured die-cast"} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-vault-950 via-vault-950/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-[10px] text-primary uppercase tracking-widest mb-2 font-semibold">Featured Drop</p>
          <h3 className="text-xl font-display font-semibold mb-1 line-clamp-1">{listing?.title ?? "Skyline GT-R V-Spec"}</h3>
          <p className="text-sm text-vault-300">{listing ? formatINR(listing.price_cents) : "₹2,499"}</p>
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-vault-900/60 ring-1 ring-white/5 rounded-2xl p-6">
      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Icon className="size-5" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-vault-400">{desc}</p>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link to="/listing/$listingId" params={{ listingId: listing.id }} className="group bg-vault-900/50 rounded-xl ring-1 ring-white/5 overflow-hidden flex flex-col hover:ring-primary/30 hover:-translate-y-0.5 transition-all duration-300">
      <div className="relative w-full aspect-[4/3] bg-vault-800 overflow-hidden">
        {listing.image_urls?.[0] ? (
          <img src={listing.image_urls[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : <div className="w-full h-full flex items-center justify-center text-vault-600"><ShoppingCart className="size-8" /></div>}
        {listing.rarity && (
          <span className="absolute top-3 left-3 text-[10px] font-bold bg-vault-950/80 backdrop-blur-md text-primary px-2 py-1 rounded ring-1 ring-primary/30 uppercase tracking-wider">{listing.rarity}</span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h3>
            <p className="text-xs text-vault-500 tracking-wide uppercase truncate">{listing.brand ?? "Hot Wheels"} {listing.series ? `· ${listing.series}` : ""}</p>
          </div>
          <span className="text-[10px] font-semibold bg-vault-800 px-2 py-0.5 rounded text-vault-400 shrink-0">{listing.condition}</span>
        </div>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
          <div>
            <p className="text-[10px] text-vault-500 uppercase">Price</p>
            <p className="text-lg font-display font-medium">{formatINR(listing.price_cents)}</p>
          </div>
          <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded group-hover:bg-primary group-hover:text-vault-950 transition-all">Buy</span>
        </div>
      </div>
    </Link>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const l = auction.listings;
  return (
    <Link to="/auction/$auctionId" params={{ auctionId: auction.id }} className="group bg-vault-900/60 rounded-xl ring-1 ring-white/5 overflow-hidden flex flex-col hover:ring-primary/40 hover:-translate-y-0.5 transition-all">
      <div className="relative w-full aspect-[4/3] bg-vault-800 overflow-hidden">
        {l?.image_urls?.[0] ? (
          <img src={l.image_urls[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : <div className="w-full h-full" />}
        <div className="absolute top-3 right-3 px-2 py-1 bg-vault-950/80 backdrop-blur-md rounded text-[10px] font-bold text-primary ring-1 ring-primary/30 flex items-center gap-1">
          <Timer className="size-3" />
          {formatTimeLeft(auction.ends_at)}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{l?.title}</h3>
        <p className="text-xs text-vault-500 uppercase tracking-wide truncate">{l?.brand} {l?.series ? `· ${l.series}` : ""}</p>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
          <div>
            <p className="text-[10px] text-vault-500 uppercase">Current Bid</p>
            <p className="text-lg font-display font-medium text-primary">{formatINR(auction.current_bid_cents)}</p>
          </div>
          <span className="px-4 py-1.5 bg-primary text-vault-950 text-xs font-semibold rounded">Bid →</span>
        </div>
      </div>
    </Link>
  );
}
