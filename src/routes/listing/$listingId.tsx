import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getListing, addToCart } from "@/lib/marketplace.functions";
import { ShoppingCart, ArrowLeft, Heart, Share2, Star, Truck, Shield } from "lucide-react";

const listingQueryOptions = (id: string) => queryOptions({
  queryKey: ["listing", id],
  queryFn: () => getListing({ data: id }),
});

export const Route = createFileRoute("/listing/$listingId")({
  head: ({ params }) => ({
    meta: [
      { title: `Listing — WheelVault` },
      { name: "description", content: "View this die-cast collectible on WheelVault." },
    ],
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(listingQueryOptions(params.listingId));
  },
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
  const { data } = useQuery(listingQueryOptions(listingId));
  const listing = data?.listing;
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const addToCartFn = useServerFn(addToCart);

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-muted-foreground">
        <p>Loading...</p>
      </div>
    );
  }

  const price = (listing.price_cents / 100).toFixed(2);
  const image = listing.image_urls?.[0];

  async function handleAddToCart() {
    setAdding(true);
    try {
      await addToCartFn({ data: { listing_id: listing.id, qty: 1 } });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      if (err.message?.includes("Unauthorized")) {
        navigate({ to: "/auth" });
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-vault-400 hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="size-4" />
        Back to browse
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-square bg-vault-900 rounded-2xl overflow-hidden ring-1 ring-white/5">
            {image ? (
              <img src={image} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-vault-600">
                <ShoppingCart className="size-16" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {listing.image_urls?.slice(1, 5).map((img, i) => (
              <div key={i} className="aspect-square bg-vault-900 rounded-lg overflow-hidden ring-1 ring-white/5">
                <img src={img} alt={`${listing.title} ${i + 2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded">{listing.condition}</span>
            {listing.rarity && (
              <span className="text-xs font-semibold uppercase tracking-wider text-vault-400 bg-vault-800 px-2.5 py-1 rounded">{listing.rarity}</span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">{listing.title}</h1>

          <div className="flex items-center gap-4 mb-6">
            <p className="text-3xl font-display font-semibold text-primary">${price}</p>
            {listing.stock <= 3 && listing.stock > 0 && (
              <span className="text-xs font-semibold text-destructive">Only {listing.stock} left</span>
            )}
          </div>

          <p className="text-vault-400 leading-relaxed mb-8">{listing.description || "No description provided."}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-vault-900/50 rounded-lg p-4 ring-1 ring-white/5">
              <p className="text-[10px] uppercase tracking-widest text-vault-500 mb-1">Brand</p>
              <p className="font-medium">{listing.brand ?? "Hot Wheels"}</p>
            </div>
            <div className="bg-vault-900/50 rounded-lg p-4 ring-1 ring-white/5">
              <p className="text-[10px] uppercase tracking-widest text-vault-500 mb-1">Series</p>
              <p className="font-medium">{listing.series ?? "—"}</p>
            </div>
            <div className="bg-vault-900/50 rounded-lg p-4 ring-1 ring-white/5">
              <p className="text-[10px] uppercase tracking-widest text-vault-500 mb-1">Year</p>
              <p className="font-medium">{listing.year ?? "—"}</p>
            </div>
            <div className="bg-vault-900/50 rounded-lg p-4 ring-1 ring-white/5">
              <p className="text-[10px] uppercase tracking-widest text-vault-500 mb-1">Stock</p>
              <p className="font-medium">{listing.stock}</p>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={adding || listing.stock <= 0}
              className="flex-1 bg-primary text-vault-950 font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {added ? "Added to Cart" : <><ShoppingCart className="size-4" /> Add to Cart</>}
            </button>
            <button className="p-3 bg-vault-900 border border-white/10 rounded-lg hover:bg-vault-800 transition-colors">
              <Heart className="size-5" />
            </button>
            <button className="p-3 bg-vault-900 border border-white/10 rounded-lg hover:bg-vault-800 transition-colors">
              <Share2 className="size-5" />
            </button>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-8">
            <div className="flex items-center gap-3 text-sm text-vault-400">
              <Truck className="size-5 text-primary" />
              <span>Free insured shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-vault-400">
              <Shield className="size-5 text-primary" />
              <span>Vault-authenticated condition guarantee</span>
            </div>
          </div>

          {listing.profiles && (
            <div className="mt-8 flex items-center gap-3 p-4 bg-vault-900/50 rounded-lg ring-1 ring-white/5">
              <div className="size-10 rounded-full bg-vault-800 flex items-center justify-center text-sm font-semibold">
                {(listing.profiles.display_name ?? "S")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{listing.profiles.display_name ?? "Seller"}</p>
                <p className="text-xs text-vault-500">Verified Seller</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
