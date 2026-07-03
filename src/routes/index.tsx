import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getFeaturedListings, getAuctions, getListings } from "@/lib/marketplace.functions";
import { formatINR, formatTimeLeft } from "@/lib/format";
import { ListingImage } from "@/components/HotWheelsPlaceholder";
import { useEffect, useState } from "react";
import { Flame, Gavel, Truck, ShieldCheck, MessageCircle, ArrowRight } from "lucide-react";

const featuredQO = queryOptions({ queryKey: ["featured"], queryFn: () => getFeaturedListings() });
const auctionsQO = queryOptions({ queryKey: ["auctions"], queryFn: () => getAuctions() });
const allQO = queryOptions({ queryKey: ["listings"], queryFn: () => getListings() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WheelVault — Authentic Hot Wheels & Die-Cast in India" },
      { name: "description", content: "Curated Hot Wheels treasure hunts, super treasure hunts, premium series and rare castings. Buy at fixed price or bid in live auctions. WhatsApp checkout." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(featuredQO),
      context.queryClient.ensureQueryData(auctionsQO),
      context.queryClient.ensureQueryData(allQO),
    ]);
  },
  component: Home,
});

function Home() {
  const { data: featured } = useQuery(featuredQO);
  const { data: auctions } = useQuery(auctionsQO);
  const { data: all } = useQuery(allQO);
  const featuredItems = featured?.listings ?? [];
  const auctionItems = (auctions?.auctions ?? []).filter((a: any) => a.status === "live" && new Date(a.ends_at).getTime() > Date.now());
  const allItems = all?.listings ?? [];

  return (
    <div>
      <Marquee />
      <Hero hasItems={allItems.length > 0} />
      <TrustBar />

      {auctionItems.length > 0 && (
        <Section title="Live Auctions" icon={<Gavel className="size-5 text-primary" />} link="/auctions" linkLabel="View all auctions">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {auctionItems.slice(0, 3).map((a) => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </Section>
      )}

      {featuredItems.length > 0 && (
        <Section title="Featured in the Vault" icon={<Flame className="size-5 text-primary" />} link="/browse" linkLabel="Browse all">
          <Grid items={featuredItems} />
        </Section>
      )}

      {allItems.length > 0 ? (
        <Section title="Latest Arrivals" link="/browse" linkLabel="See more">
          <Grid items={allItems.slice(0, 8)} />
        </Section>
      ) : (
        <EmptyVault />
      )}

      <HowItWorks />
    </div>
  );
}

function Marquee() {
  return (
    <div className="bg-primary text-vault-950 font-semibold text-xs uppercase tracking-widest overflow-hidden border-b border-orange-700/30">
      <div className="flex gap-12 py-2.5 animate-[scroll_30s_linear_infinite] whitespace-nowrap">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="flex items-center gap-3">
            <Flame className="size-3" /> Treasure Hunts
            <span className="opacity-50">•</span> Super TH
            <span className="opacity-50">•</span> Premium
            <span className="opacity-50">•</span> RLC
            <span className="opacity-50">•</span> JDM
            <span className="opacity-50">•</span> Boulevard
            <span className="opacity-50">•</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function Hero({ hasItems }: { hasItems: boolean }) {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(255,107,0,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_80%,rgba(255,107,0,0.10),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest bg-primary/15 text-primary px-3 py-1.5 rounded-full ring-1 ring-primary/30">
            <span className="size-1.5 bg-primary rounded-full animate-pulse" /> Curated by collectors · Shipped from India
          </span>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tighter mt-6 leading-[1.02]">
            The Vault for <span className="text-primary italic">Hot Wheels</span> Hunters.
          </h1>
          <p className="text-vault-300 text-lg mt-6 max-w-2xl leading-relaxed">
            Treasure Hunts, Super TH, Premium, RLC, JDM and rare castings — handpicked, authenticated, and ready to ship. Buy at fixed price or bid live.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/browse" className="bg-primary text-vault-950 px-6 py-3 rounded-full font-semibold hover:bg-primary/90 flex items-center gap-2">
              Browse Vault <ArrowRight className="size-4" />
            </Link>
            <Link to="/auctions" className="bg-vault-900 ring-1 ring-white/10 px-6 py-3 rounded-full font-semibold hover:ring-primary/40 flex items-center gap-2">
              <Gavel className="size-4" /> Live Auctions
            </Link>
          </div>
          {!hasItems && (
            <p className="text-sm text-vault-500 mt-6 italic">New drops landing soon — admin uploads in progress.</p>
          )}
        </div>
        <div className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-white/10 bg-gradient-to-br from-orange-600 via-red-700 to-vault-950 shadow-2xl shadow-orange-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)] opacity-25" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-display font-black text-5xl md:text-6xl text-white italic tracking-tighter drop-shadow-2xl">HOT WHEELS</div>
              <div className="text-white/80 text-xs mt-2 uppercase tracking-[0.4em] font-semibold">WheelVault Collection</div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 bg-vault-950/70 backdrop-blur-md rounded-xl p-3 ring-1 ring-white/10 flex items-center justify-between text-xs">
            <span className="font-semibold">Insured shipping</span>
            <span className="text-vault-300">BlueDart · DHL</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: ShieldCheck, label: "100% Authentic", sub: "Personally inspected" },
    { icon: MessageCircle, label: "WhatsApp Orders", sub: "Quick & transparent" },
    { icon: Truck, label: "Insured Shipping", sub: "BlueDart / DHL" },
    { icon: Gavel, label: "Live Auctions", sub: "Real-time bidding" },
  ];
  return (
    <div className="border-y border-white/5 bg-vault-950/50">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3">
            <it.icon className="size-6 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold">{it.label}</p>
              <p className="text-xs text-vault-400">{it.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon, link, linkLabel, children }: { title: string; icon?: React.ReactNode; link?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight flex items-center gap-2">{icon}{title}</h2>
        {link && <Link to={link} className="text-sm text-vault-300 hover:text-primary flex items-center gap-1">{linkLabel} <ArrowRight className="size-3.5" /></Link>}
      </div>
      {children}
    </section>
  );
}

function Grid({ items }: { items: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {items.map((l) => (
        <Link key={l.id} to="/listing/$listingId" params={{ listingId: l.id }} className="group">
          <div className="aspect-square bg-vault-900 rounded-xl overflow-hidden ring-1 ring-white/5 group-hover:ring-primary/40 transition-all">
            <ListingImage src={l.image_urls?.[0]} alt={l.title} />
          </div>
          <div className="mt-3">
            <p className="text-xs text-vault-400 uppercase tracking-wide truncate">{l.brand || "Hot Wheels"} · {l.series || "Mainline"}</p>
            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{l.title}</p>
            <p className="text-primary font-display font-semibold mt-0.5">{formatINR(l.price_cents)}</p>
            {l.status === "reserved" && <span className="text-[10px] uppercase tracking-wider text-yellow-400 font-semibold">Reserved</span>}
            {l.status === "sold" && <span className="text-[10px] uppercase tracking-wider text-vault-500 font-semibold">Sold</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

function AuctionCard({ auction }: { auction: any }) {
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((n) => n + 1), 1000); return () => clearInterval(i); }, []);
  const l = auction.listings;
  return (
    <Link to="/auction/$auctionId" params={{ auctionId: auction.id }} className="group block bg-vault-900/60 ring-1 ring-white/5 rounded-2xl overflow-hidden hover:ring-primary/40 transition-all">
      <div className="aspect-[4/3] bg-vault-900 relative">
        <ListingImage src={l?.image_urls?.[0]} alt={l?.title ?? ""} />
        <div className="absolute top-3 left-3 bg-primary text-vault-950 text-[10px] font-bold uppercase px-2 py-1 rounded">Live · {formatTimeLeft(auction.ends_at)}</div>
      </div>
      <div className="p-4">
        <p className="text-xs text-vault-400 uppercase tracking-wide">{l?.brand || "Hot Wheels"}</p>
        <p className="font-medium truncate group-hover:text-primary transition-colors">{l?.title}</p>
        <div className="flex justify-between items-end mt-3">
          <div>
            <p className="text-[10px] text-vault-500 uppercase tracking-wider">Current Bid</p>
            <p className="text-primary font-display font-bold text-lg">{formatINR(auction.current_bid_cents)}</p>
          </div>
          <span className="text-xs text-vault-400">Bid now →</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyVault() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20 text-center">
      <div className="size-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-display font-black italic text-2xl">HW</div>
      <h3 className="font-display font-bold text-2xl mb-3">The vault is being stocked.</h3>
      <p className="text-vault-400 leading-relaxed">New Hot Wheels drops are being added by the seller. Check back shortly, or follow on WhatsApp for instant alerts.</p>
      <a href="https://api.whatsapp.com/send?phone=917483595994" target="_blank" rel="noopener noreferrer" className="inline-flex mt-6 items-center gap-2 bg-[#25D366] text-black px-5 py-2.5 rounded-full font-semibold">
        <MessageCircle className="size-4" /> WhatsApp the Seller
      </a>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Browse the vault", d: "Treasure hunts, premiums, JDM, and rare castings — all photographed in-hand." },
    { n: "02", t: "Buy or place a bid", d: "Fixed price for instant purchase, or live auctions with real-time bid history." },
    { n: "03", t: "Confirm on WhatsApp", d: "Share name, phone, address. Get UPI / bank details and arrange BlueDart / DHL pickup." },
  ];
  return (
    <section className="bg-vault-950/40 border-y border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-10 text-center">How WheelVault Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-vault-900/60 ring-1 ring-white/5 rounded-2xl p-6">
              <p className="font-display font-bold text-primary text-3xl">{s.n}</p>
              <p className="font-semibold mt-3">{s.t}</p>
              <p className="text-sm text-vault-400 mt-1 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
