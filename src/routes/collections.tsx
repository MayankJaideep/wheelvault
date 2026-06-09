import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getListings } from "@/lib/marketplace.functions";
import { Search } from "lucide-react";

const listingsQueryOptions = queryOptions({
  queryKey: ["collections-listings"],
  queryFn: () => getListings(),
});

export const Route = createFileRoute("/collections")({
  head: () => ({
    meta: [
      { title: "Collections — WheelVault" },
      { name: "description", content: "Explore curated die-cast collections on WheelVault." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(listingsQueryOptions);
  },
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data } = useQuery(listingsQueryOptions);
  const listings = data?.listings ?? [];

  // Group by brand for simple collections view
  const byBrand = listings.reduce((acc, l) => {
    const brand = l.brand ?? "Hot Wheels";
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(l);
    return acc;
  }, {} as Record<string, typeof listings>);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-display font-semibold mb-2">Curated Collections</h1>
      <p className="text-vault-400 text-sm mb-10">Explore themed collections from the WheelVault community.</p>

      <div className="space-y-12">
        {Object.entries(byBrand).slice(0, 4).map(([brand, items]) => (
          <div key={brand}>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-xl font-display font-semibold">{brand}</h2>
              <span className="text-sm text-vault-500">{items.length} items</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.slice(0, 6).map((item) => (
                <Link key={item.id} to="/listing/$listingId" params={{ listingId: item.id }} className="group">
                  <div className="aspect-square bg-vault-900 rounded-xl overflow-hidden ring-1 ring-white/5 mb-3">
                    {item.image_urls?.[0] ? (
                      <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-vault-600">
                        <Search className="size-5" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-xs text-vault-500">${(item.price_cents / 100).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
