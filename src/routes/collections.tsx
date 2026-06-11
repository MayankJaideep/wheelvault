import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getListings } from "@/lib/marketplace.functions";
import { ListingImage } from "@/components/HotWheelsPlaceholder";
import { formatINR } from "@/lib/format";

const allQO = queryOptions({ queryKey: ["listings"], queryFn: () => getListings() });

export const Route = createFileRoute("/collections")({
  head: () => ({ meta: [{ title: "Collections — WheelVault" }, { name: "description", content: "Hot Wheels grouped by series and brand line." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allQO),
  component: Collections,
});

function Collections() {
  const { data } = useQuery(allQO);
  const listings = data?.listings ?? [];
  const grouped = listings.reduce<Record<string, typeof listings>>((acc, l) => {
    const k = l.series || l.brand || "Mainline";
    (acc[k] ||= []).push(l);
    return acc;
  }, {});
  const groups = Object.entries(grouped);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display font-extrabold text-3xl md:text-4xl">Collections</h1>
      <p className="text-vault-400 mt-2">Grouped by series and brand line.</p>

      {groups.length === 0 ? (
        <p className="text-center text-vault-400 py-20">No collections yet.</p>
      ) : (
        <div className="space-y-14 mt-10">
          {groups.map(([name, items]) => (
            <section key={name}>
              <h2 className="font-display font-bold text-xl mb-5 flex items-center gap-3">
                <span className="text-primary">{name}</span>
                <span className="text-xs text-vault-500 font-sans font-normal">{items.length} items</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.slice(0, 6).map((l) => (
                  <Link key={l.id} to="/listing/$listingId" params={{ listingId: l.id }} className="group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-vault-900 ring-1 ring-white/5 group-hover:ring-primary/40">
                      <ListingImage src={l.image_urls?.[0]} alt={l.title} />
                    </div>
                    <p className="text-xs mt-2 truncate group-hover:text-primary">{l.title}</p>
                    <p className="text-xs text-primary font-display font-semibold">{formatINR(l.price_cents)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
