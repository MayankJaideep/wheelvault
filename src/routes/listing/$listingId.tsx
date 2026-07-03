import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getListing } from "@/lib/marketplace.functions";
import { formatINR } from "@/lib/format";
import { ListingImage } from "@/components/HotWheelsPlaceholder";
import { WhatsAppOrderDialog } from "@/components/WhatsAppOrderDialog";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, ShieldCheck, Truck } from "lucide-react";

const qo = (id: string) => queryOptions({ queryKey: ["listing", id], queryFn: () => getListing({ data: id }) });

export const Route = createFileRoute("/listing/$listingId")({
  head: ({ params }) => ({ meta: [{ title: `Listing — WheelVault` }, { name: "description", content: `Hot Wheels listing ${params.listingId}` }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(qo(params.listingId)),
  component: ListingPage,
  errorComponent: () => <div className="p-12 text-center text-muted-foreground">Listing not found.</div>,
  notFoundComponent: () => <div className="p-12 text-center">Listing not found.</div>,
});

function ListingPage() {
  const { listingId } = Route.useParams();
  const { data } = useQuery(qo(listingId));
  const l = data?.listing;
  const activeAuction = data?.auction;
  const [active, setActive] = useState(0);
  const [dialogKind, setDialogKind] = useState<null | "buy" | "reserve">(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session?.user)); }, []);

  if (!l) return <div className="p-12 text-center">Loading…</div>;
  const isSold = l.status === "sold";
  const isReserved = l.status === "reserved";

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-vault-400 hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Back to browse
      </Link>

      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square bg-vault-900 rounded-2xl overflow-hidden ring-1 ring-white/5">
            <ListingImage src={l.image_urls?.[active]} alt={l.title} />
          </div>
          {l.image_urls?.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {l.image_urls.map((u: string, i: number) => (
                <button key={i} onClick={() => setActive(i)} className={`size-16 rounded-lg overflow-hidden ring-2 shrink-0 ${i === active ? "ring-primary" : "ring-white/10"}`}>
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase text-primary bg-primary/15 px-2.5 py-1 rounded">{l.condition}</span>
            {l.rarity && <span className="text-xs font-semibold uppercase text-vault-200 bg-vault-800 px-2.5 py-1 rounded">{l.rarity}</span>}
            {isReserved && <span className="text-xs font-semibold uppercase text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded">Reserved</span>}
            {isSold && <span className="text-xs font-semibold uppercase text-vault-300 bg-vault-800 px-2.5 py-1 rounded">Sold</span>}
          </div>
          <p className="text-sm text-vault-400 uppercase tracking-wide">{l.brand || "Hot Wheels"} {l.series ? `· ${l.series}` : ""} {l.year ? `· ${l.year}` : ""}</p>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-1">{l.title}</h1>
          <p className="text-primary font-display font-bold text-3xl mt-5">{formatINR(l.price_cents)}</p>

          {activeAuction ? (
            <div className="mt-6 bg-vault-900/60 ring-1 ring-primary/30 rounded-xl p-5">
              <p className="text-sm text-vault-300">This item is up for live auction.</p>
              <Link to="/auction/$auctionId" params={{ auctionId: activeAuction.id }} className="mt-3 inline-flex bg-primary text-vault-950 font-semibold px-5 py-2.5 rounded-full">Bid in auction</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => setDialogKind("buy")}
                disabled={isSold}
                className="bg-[#25D366] text-black font-semibold py-3 rounded-full hover:bg-[#1ebe5b] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-5" />
                {isSold ? "Sold" : isReserved ? "Reserved — message anyway" : "Buy on WhatsApp"}
              </button>
              {!isSold && !isReserved && (
                <button onClick={() => setDialogKind("reserve")} className="bg-vault-900 ring-1 ring-white/10 py-3 rounded-full font-semibold hover:ring-primary/40">
                  Reserve & ask a question
                </button>
              )}
            </div>
          )}

          {l.description && <p className="text-vault-300 leading-relaxed mt-7 whitespace-pre-line">{l.description}</p>}

          <div className="grid grid-cols-2 gap-3 mt-8">
            <Info icon={<ShieldCheck className="size-4" />} label="Authentic" sub="In-hand inspected" />
            <Info icon={<Truck className="size-4" />} label="Insured" sub="BlueDart / DHL" />
          </div>
        </div>
      </div>

      <WhatsAppOrderDialog
        open={!!dialogKind}
        onClose={() => setDialogKind(null)}
        kind={dialogKind ?? "buy"}
        itemTitle={l.title}
        amountCents={l.price_cents}
        listingId={l.id}
        isAuthenticated={authed}
        itemImageUrl={l.image_urls?.[0]}
      />
    </div>
  );
}

function Info({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="bg-vault-900/60 ring-1 ring-white/5 rounded-lg p-3 flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-vault-400">{sub}</p>
      </div>
    </div>
  );
}
