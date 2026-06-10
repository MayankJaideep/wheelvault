import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getListing, addToCart } from "@/lib/marketplace.functions";
import { formatINR } from "@/lib/format";
import { ShoppingCart, ArrowLeft, Heart, Share2, Truck, Shield } from "lucide-react";

const listingQO = (id: string) => queryOptions({ queryKey: ["listing", id], queryFn: () => getListing({ data: id }) });

export const Route = createFileRoute("/listing/$listingId")({
  head: () => ({ meta: [{ title: "Listing — WheelVault" }, { name: "description", content: "View this die-cast collectible on WheelVault." }] }),
  loader: async ({ context, params }) => { await context.queryClient.ensureQueryData(listingQO(params.listingId)); },
  component: ListingPage,
  errorComponent: () => (
    <div className="max-w-7xl mx-auto px-6 py-24 text-center text-muted-foreground">
      <p>Listing not found.</p>
      <Link to="/browse" className="text-primary hover:underline mt-4 inline-block">Back to browse</Link>
    </div>
  ),
});

function ListingPage() {
  const { listingId } = Route.useParams();
  const { data } = useQuery(listingQO(listingId));
  const listing = data?.listing;
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const addFn = useServerFn(addToCart);

  if (!listing) return <div className="max-w-7xl mx-auto px-6 py-24 text-center text-muted-foreground">Loading...</div>;

  const images = listing.image_urls?.length ? listing.image_urls : ["https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=800&h=600&fit=crop"];

  async function handleAdd() {
    setAdding(true);
    try {
      await addFn({ data: { listing_id: listing!.id, qty: 1 } });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      if (err.message?.includes("Unauthorized")) navigate({ to: "/auth" });
    } finally { setAdding(false); }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-vault-400 hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="size-4" /> Back to browse
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-square bg-vault-900 rounded-2xl overflow-hidden ring-1 ring-white/5">
            <img src={images[activeImg]} alt={listing.title} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(0, 4).map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square bg-vault-900 rounded-lg overflow-hidden ring-1 ${activeImg === i ? "ring-primary" : "ring-white/5"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded">{listing.condition}</span>
            {listing.rarity && <span className="text-xs font-semibold uppercase tracking-wider text-vault-300 bg-vault-800 px-2.5 py-1 rounded">{listing.rarity}</span>}
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">{listing.title}</h1>

          <div className="flex items-center gap-4 mb-6">
            <p className="text-4xl font-display font-semibold text-primary">{formatINR(listing.price_cents)}</p>
            {listing.stock <= 3 && listing.stock > 0 && <span className="text-xs font-semibold text-destructive">Only {listing.stock} left</span>}
          </div>

          <p className="text-vault-400 leading-relaxed mb-8">{listing.description || "No description provided."}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <Info label="Brand" value={listing.brand ?? "Hot Wheels"} />
            <Info label="Series" value={listing.series ?? "—"} />
            <Info label="Year" value={String(listing.year ?? "—")} />
            <Info label="Stock" value={String(listing.stock)} />
          </div>

          <div className="flex gap-3 mb-8">
            <button onClick={handleAdd} disabled={adding || listing.stock <= 0}
              className="flex-1 bg-primary text-vault-950 font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {added ? "Added to Cart ✓" : <><ShoppingCart className="size-4" /> Add to Cart</>}
            </button>
            <button className="p-3 bg-vault-900 border border-white/10 rounded-lg hover:bg-vault-800"><Heart className="size-5" /></button>
            <button className="p-3 bg-vault-900 border border-white/10 rounded-lg hover:bg-vault-800"><Share2 className="size-5" /></button>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-8">
            <div className="flex items-center gap-3 text-sm text-vault-400"><Truck className="size-5 text-primary" /><span>Free insured shipping on orders over ₹2,500</span></div>
            <div className="flex items-center gap-3 text-sm text-vault-400"><Shield className="size-5 text-primary" /><span>Vault-authenticated condition guarantee</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-vault-900/50 rounded-lg p-4 ring-1 ring-white/5">
      <p className="text-[10px] uppercase tracking-widest text-vault-500 mb-1">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
