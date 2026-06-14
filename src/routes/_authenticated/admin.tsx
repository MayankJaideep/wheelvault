import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getMyProfile,
  getListings,
  adminCreateListing,
  adminUpdateListing,
  adminDeleteListing,
  adminAddListingImages,
  adminCreateAuction,
  adminEndAuction,
  adminGetAuctions,
  adminGetInquiries,
  adminUpdateInquiryStatus,
} from "@/lib/marketplace.functions";
import { uploadListingImage } from "@/lib/storage";
import { formatINR, formatTimeLeft } from "@/lib/format";
import { ListingImage } from "@/components/HotWheelsPlaceholder";
import { Shield, Plus, Trash2, Edit2, Star, Image as ImageIcon, Gavel, Inbox, X, Check, Megaphone } from "lucide-react";

const profileQO = queryOptions({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — WheelVault" }] }),
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => ({
    tab: search.tab === "listings" || search.tab === "auctions" || search.tab === "inquiries" || search.tab === "new" ? search.tab : undefined,
  }),
  component: AdminPage,
});

type Tab = "listings" | "auctions" | "inquiries" | "new";

function AdminPage() {
  const { data: p, isLoading } = useQuery(profileQO);
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<Tab>(search.tab ?? "new");

  useEffect(() => {
    if (!isLoading && p && !p.isAdmin) navigate({ to: "/" });
  }, [p, isLoading, navigate]);

  if (isLoading) return <div className="p-12 text-center">Loading…</div>;
  if (!p?.isAdmin) return <div className="p-12 text-center text-vault-400">Admins only.</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="size-7 text-primary" />
        <h1 className="font-display font-extrabold text-3xl">Admin Dashboard</h1>
      </div>
      <p className="text-vault-400 mb-8">Add your Hot Wheels collection with photos, price, stock, featured banners, auctions, and order tracking.</p>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5">
        {([
          ["listings", "Listings", ImageIcon],
          ["auctions", "Auctions", Gavel],
          ["inquiries", "Orders / Inquiries", Inbox],
          ["new", "+ New Listing", Plus],
        ] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? "border-primary text-primary" : "border-transparent text-vault-400 hover:text-foreground"}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "listings" && <ListingsTab />}
      {tab === "auctions" && <AuctionsTab />}
      {tab === "inquiries" && <InquiriesTab />}
      {tab === "new" && <NewListingTab onCreated={() => setTab("listings")} />}
    </div>
  );
}

// ---------- LISTINGS TAB ----------
const allQO = queryOptions({ queryKey: ["listings"], queryFn: () => getListings() });

function ListingsTab() {
  const { data } = useQuery(allQO);
  const listings = data?.listings ?? [];
  const qc = useQueryClient();
  const update = useServerFn(adminUpdateListing);
  const del = useServerFn(adminDeleteListing);

  async function toggle(id: string, field: "featured" | "is_banner", current: boolean) {
    await update({ data: { id, patch: { [field]: !current } as any } });
    qc.invalidateQueries({ queryKey: ["listings"] });
    qc.invalidateQueries({ queryKey: ["featured"] });
  }
  async function setStatus(id: string, status: string) {
    await update({ data: { id, patch: { status } as any } });
    qc.invalidateQueries({ queryKey: ["listings"] });
  }
  async function remove(id: string) {
    if (!confirm("Delete this listing permanently?")) return;
    await del({ data: id });
    qc.invalidateQueries({ queryKey: ["listings"] });
  }

  if (listings.length === 0) return <p className="text-vault-400">No listings yet. Click + New Listing to add your first.</p>;

  return (
    <div className="space-y-3">
      {listings.map((l) => (
        <ListingRow key={l.id} l={l} setStatus={setStatus} toggle={toggle} remove={remove} />
      ))}
    </div>
  );
}

function ListingRow({ l, setStatus, toggle, remove }: any) {
  const [editing, setEditing] = useState(false);
  const update = useServerFn(adminUpdateListing);
  const qc = useQueryClient();
  const [price, setPrice] = useState(String(l.price_cents / 100));
  const [title, setTitle] = useState(l.title);
  const [stock, setStock] = useState(String(l.stock));

  async function save() {
    await update({ data: { id: l.id, patch: { title, price_cents: Math.round(parseFloat(price) * 100), stock: parseInt(stock, 10) || 1 } as any } });
    qc.invalidateQueries({ queryKey: ["listings"] });
    setEditing(false);
  }

  return (
    <div className="bg-vault-900/60 ring-1 ring-white/5 rounded-xl p-4 flex flex-wrap items-center gap-3">
      <div className="size-16 rounded-lg overflow-hidden ring-1 ring-white/10 shrink-0"><ListingImage src={l.image_urls?.[0]} alt={l.title} /></div>
      <div className="flex-1 min-w-[180px]">
        {editing ? (
          <div className="space-y-1.5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-vault-950 ring-1 ring-white/10 rounded px-2 py-1 text-sm" />
            <div className="flex gap-2">
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="₹" className="w-24 bg-vault-950 ring-1 ring-white/10 rounded px-2 py-1 text-xs" />
              <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" placeholder="Stock" className="w-20 bg-vault-950 ring-1 ring-white/10 rounded px-2 py-1 text-xs" />
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold">{l.title}</p>
            <p className="text-xs text-vault-400">{l.brand} · {l.series || "—"} · {l.condition} · Stock {l.stock}</p>
            <p className="text-primary font-display font-semibold text-sm mt-1">{formatINR(l.price_cents)}</p>
          </>
        )}
      </div>
      <select value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} className="bg-vault-950 ring-1 ring-white/10 rounded px-2 py-1 text-xs">
        <option value="active">Active</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="hidden">Hidden</option>
      </select>
      <button onClick={() => toggle(l.id, "featured", l.featured)} title="Toggle featured" className={`p-2 rounded ${l.featured ? "bg-primary/20 text-primary" : "bg-vault-950 text-vault-400"}`}>
        <Star className="size-4" />
      </button>
      <button onClick={() => toggle(l.id, "is_banner", l.is_banner)} title="Toggle homepage banner" className={`p-2 rounded ${l.is_banner ? "bg-primary/20 text-primary" : "bg-vault-950 text-vault-400"}`}>
        <Megaphone className="size-4" />
      </button>
      {editing ? (
        <button onClick={save} className="p-2 rounded bg-primary/20 text-primary"><Check className="size-4" /></button>
      ) : (
        <button onClick={() => setEditing(true)} className="p-2 rounded bg-vault-950 text-vault-400 hover:text-foreground"><Edit2 className="size-4" /></button>
      )}
      <button onClick={() => remove(l.id)} className="p-2 rounded bg-vault-950 text-vault-400 hover:text-destructive"><Trash2 className="size-4" /></button>
    </div>
  );
}

// ---------- AUCTIONS TAB ----------
const adminAuctionsQO = queryOptions({ queryKey: ["admin-auctions"], queryFn: () => adminGetAuctions() });

function AuctionsTab() {
  const { data } = useQuery(adminAuctionsQO);
  const list = data?.auctions ?? [];
  const qc = useQueryClient();
  const end = useServerFn(adminEndAuction);
  const create = useServerFn(adminCreateAuction);
  const addImages = useServerFn(adminAddListingImages);
  const { data: lsData } = useQuery(allQO);
  const listings = (lsData?.listings ?? []).filter((l) => l.status !== "sold");
  const [show, setShow] = useState(false);
  const [listingId, setListingId] = useState("");
  const [start, setStart] = useState("");
  const [inc, setInc] = useState("100");
  const [mode, setMode] = useState<"days" | "datetime">("days");
  const [days, setDays] = useState("3");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [addedPhotoCounts, setAddedPhotoCounts] = useState<Record<string, number>>({});
  const [uploadingAuctionPhotos, setUploadingAuctionPhotos] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const selectedListing = listings.find((l) => l.id === listingId);
  const selectedHasPhotos = !!selectedListing && ((selectedListing.image_urls?.length ?? 0) + (addedPhotoCounts[listingId] ?? 0) > 0);

  async function onAuctionFiles(files: FileList | null) {
    if (!listingId) { setErr("Select a listing before uploading photos"); return; }
    if (!files || files.length === 0) return;
    setErr(null); setUploadingAuctionPhotos(true);
    try {
      const image_urls: string[] = [];
      for (const file of Array.from(files)) image_urls.push(await uploadListingImage(file));
      await addImages({ data: { id: listingId, image_urls } });
      setAddedPhotoCounts((prev) => ({ ...prev, [listingId]: (prev[listingId] ?? 0) + image_urls.length }));
      qc.invalidateQueries({ queryKey: ["listings"] });
    } catch (e: any) { setErr(e?.message ?? "Photo upload failed"); }
    finally { setUploadingAuctionPhotos(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      if (!listingId) throw new Error("Select a listing");
      if (!selectedHasPhotos) throw new Error("Upload at least one car photo before starting an auction");
      const endsAt = mode === "days"
        ? new Date(Date.now() + parseFloat(days) * 86400000).toISOString()
        : new Date(endsAtLocal).toISOString();
      if (!endsAt || isNaN(new Date(endsAt).getTime())) throw new Error("Invalid end time");
      await create({ data: { listing_id: listingId, starting_cents: Math.round(parseFloat(start) * 100), min_increment_cents: Math.round(parseFloat(inc) * 100), ends_at: endsAt } });
      setShow(false); setListingId(""); setStart(""); setInc("100"); setDays("3"); setEndsAtLocal("");
      qc.invalidateQueries({ queryKey: ["admin-auctions"] });
      qc.invalidateQueries({ queryKey: ["auctions"] });
    } catch (e: any) { setErr(e?.message ?? "Failed"); }
  }
  async function endIt(id: string) {
    if (!confirm("End this auction now?")) return;
    await end({ data: id });
    qc.invalidateQueries({ queryKey: ["admin-auctions"] });
    qc.invalidateQueries({ queryKey: ["auctions"] });
  }

  return (
    <div>
      <button onClick={() => setShow((v) => !v)} className="mb-5 bg-primary text-vault-950 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2">
        <Plus className="size-4" /> New Auction
      </button>
      {show && (
        <form onSubmit={submit} className="bg-vault-900/60 ring-1 ring-white/5 rounded-xl p-5 mb-6 grid sm:grid-cols-2 gap-3">
          <label className="text-sm sm:col-span-2">Listing
            <select required value={listingId} onChange={(e) => setListingId(e.target.value)} className="mt-1 w-full bg-vault-950 ring-1 ring-white/10 rounded px-3 py-2">
              <option value="">Select…</option>
              {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </label>
          {listingId && !selectedHasPhotos && (
            <div className="sm:col-span-2 bg-vault-950/70 ring-1 ring-primary/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-primary mb-1">Add car photos before starting this auction</p>
              <p className="text-xs text-vault-400 mb-3">Auctions must show at least one real photo so buyers can bid confidently.</p>
              <label className="inline-flex items-center gap-2 bg-primary text-vault-950 px-4 py-2 rounded-full font-semibold text-sm cursor-pointer">
                <ImageIcon className="size-4" /> {uploadingAuctionPhotos ? "Uploading…" : "Upload auction photos"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onAuctionFiles(e.target.files)} />
              </label>
            </div>
          )}
          <label className="text-sm">Starting bid (₹)<input required type="number" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full bg-vault-950 ring-1 ring-white/10 rounded px-3 py-2" /></label>
          <label className="text-sm">Min increment (₹)<input required type="number" value={inc} onChange={(e) => setInc(e.target.value)} className="mt-1 w-full bg-vault-950 ring-1 ring-white/10 rounded px-3 py-2" /></label>
          <label className="text-sm sm:col-span-2">End time
            <div className="flex gap-2 mt-1">
              <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="bg-vault-950 ring-1 ring-white/10 rounded px-3 py-2 text-sm">
                <option value="days">In N days</option>
                <option value="datetime">Pick date/time</option>
              </select>
              {mode === "days"
                ? <input required type="number" step="0.5" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" className="flex-1 bg-vault-950 ring-1 ring-white/10 rounded px-3 py-2" />
                : <input required type="datetime-local" value={endsAtLocal} onChange={(e) => setEndsAtLocal(e.target.value)} className="flex-1 bg-vault-950 ring-1 ring-white/10 rounded px-3 py-2" />}
            </div>
          </label>
          {err && <p className="text-destructive text-sm sm:col-span-2">{err}</p>}
          <button type="submit" disabled={!!listingId && !selectedHasPhotos} className="sm:col-span-2 bg-primary text-vault-950 font-semibold py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">Create Auction</button>
        </form>
      )}

      {list.length === 0 ? <p className="text-vault-400">No auctions yet.</p> : (
        <div className="space-y-3">
          {list.map((a: any) => (
            <div key={a.id} className="bg-vault-900/60 ring-1 ring-white/5 rounded-xl p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[180px]">
                <p className="font-semibold">{a.listings?.title}</p>
                <p className="text-xs text-vault-400">Status: {a.status} · Ends: {a.status === "live" ? formatTimeLeft(a.ends_at) : new Date(a.ends_at).toLocaleDateString("en-IN")}</p>
              </div>
              <p className="text-primary font-display font-semibold">{formatINR(a.current_bid_cents)}</p>
              {a.status === "live" && <button onClick={() => endIt(a.id)} className="bg-vault-950 ring-1 ring-white/10 px-3 py-1.5 rounded text-xs hover:text-destructive">End now</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- INQUIRIES TAB ----------
const inqQO = queryOptions({ queryKey: ["admin-inquiries"], queryFn: () => adminGetInquiries() });

function InquiriesTab() {
  const { data } = useQuery(inqQO);
  const list = data?.inquiries ?? [];
  const qc = useQueryClient();
  const upd = useServerFn(adminUpdateInquiryStatus);
  async function mark(id: string, status: string) {
    await upd({ data: { id, status } });
    qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
  }
  if (list.length === 0) return <p className="text-vault-400">No orders or inquiries yet.</p>;
  return (
    <div className="space-y-3">
      {list.map((i: any) => (
        <div key={i.id} className="bg-vault-900/60 ring-1 ring-white/5 rounded-xl p-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-vault-400">{i.kind.replace("_", " ")} · {new Date(i.created_at).toLocaleString("en-IN")}</p>
              <p className="font-semibold mt-1">{i.listings?.title ?? "—"}</p>
              <p className="text-sm">{i.buyer_name} · {i.buyer_phone}</p>
              <p className="text-xs text-vault-400 mt-1">{i.buyer_address}{i.buyer_pincode ? ` · ${i.buyer_pincode}` : ""}</p>
              {i.notes && <p className="text-xs text-vault-300 mt-2 italic">"{i.notes}"</p>}
            </div>
            <div className="text-right">
              {i.amount_cents && <p className="text-primary font-display font-semibold">{formatINR(i.amount_cents)}</p>}
              <p className={`text-[10px] uppercase tracking-wider font-semibold mt-1 ${i.status === "new" ? "text-yellow-400" : i.status === "shipped" ? "text-green-400" : "text-vault-300"}`}>{i.status}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <a href={`https://wa.me/${i.buyer_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-[#25D366]/20 text-[#25D366] px-3 py-1.5 rounded-full font-semibold">WhatsApp buyer</a>
            <button onClick={() => mark(i.id, "confirmed")} className="text-xs bg-vault-950 ring-1 ring-white/10 px-3 py-1.5 rounded-full">Mark confirmed</button>
            <button onClick={() => mark(i.id, "shipped")} className="text-xs bg-vault-950 ring-1 ring-white/10 px-3 py-1.5 rounded-full">Mark shipped</button>
            <button onClick={() => mark(i.id, "completed")} className="text-xs bg-vault-950 ring-1 ring-white/10 px-3 py-1.5 rounded-full">Completed</button>
            <button onClick={() => mark(i.id, "cancelled")} className="text-xs bg-vault-950 ring-1 ring-white/10 px-3 py-1.5 rounded-full text-vault-400">Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- NEW LISTING TAB ----------
function NewListingTab({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(adminCreateListing);
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("Hot Wheels");
  const [series, setSeries] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("Mint in Box");
  const [rarity, setRarity] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [featured, setFeatured] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null); setUploading(true);
    try {
      const arr: string[] = [];
      for (const f of Array.from(files)) {
        const path = await uploadListingImage(f);
        arr.push(path);
      }
      setPaths((prev) => [...prev, ...arr]);
    } catch (e: any) { setError(e?.message ?? "Upload failed"); }
    finally { setUploading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !price) { setError("Title and price are required"); return; }
    setSubmitting(true);
    try {
      await create({
        data: {
          title: title.trim(),
          brand: brand.trim() || undefined,
          series: series.trim() || undefined,
          year: year ? parseInt(year, 10) : undefined,
          condition,
          rarity: rarity.trim() || undefined,
          description: description.trim() || undefined,
          price_cents: Math.round(parseFloat(price) * 100),
          image_urls: paths,
          stock: parseInt(stock, 10) || 1,
          featured,
          sale_type: "fixed",
          status: "active",
        },
      });
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["featured"] });
      onCreated();
    } catch (e: any) { setError(e?.message ?? "Failed to create"); }
    finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} className="bg-vault-900/60 ring-1 ring-white/5 rounded-2xl p-6 max-w-3xl space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <F label="Title *"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></F>
        <F label="Price (₹) *"><input required type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} /></F>
        <F label="Brand"><input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls} /></F>
        <F label="Series"><input value={series} onChange={(e) => setSeries(e.target.value)} className={inputCls} placeholder="e.g. Premium · Fast & Furious" /></F>
        <F label="Year"><input type="number" value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} /></F>
        <F label="Condition">
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className={inputCls}>
            <option>Mint in Box</option><option>Mint Loose</option><option>Near Mint</option><option>Used</option>
          </select>
        </F>
        <F label="Rarity"><input value={rarity} onChange={(e) => setRarity(e.target.value)} className={inputCls} placeholder="e.g. Treasure Hunt / Super TH" /></F>
        <F label="Stock"><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputCls} /></F>
      </div>
      <F label="Description">
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
      </F>

      <div>
        <p className="text-xs uppercase tracking-wider text-vault-400 font-semibold mb-2">Images</p>
        <label className="block bg-vault-950 ring-1 ring-dashed ring-white/15 rounded-lg p-6 text-center cursor-pointer hover:ring-primary/40">
          <ImageIcon className="size-6 mx-auto text-vault-400 mb-2" />
          <span className="text-sm text-vault-300">{uploading ? "Uploading…" : "Click to upload photos"}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </label>
        {paths.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {paths.map((p, i) => (
              <div key={p} className="relative size-20 rounded-lg overflow-hidden ring-1 ring-white/10 bg-vault-900">
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-vault-400 text-center px-1">Uploaded #{i + 1}</div>
                <button type="button" onClick={() => setPaths((prev) => prev.filter((x) => x !== p))} className="absolute top-1 right-1 size-5 rounded-full bg-vault-950/80 flex items-center justify-center"><X className="size-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-primary" />
        Feature on homepage
      </label>

      {error && <p className="text-destructive text-sm">{error}</p>}
      <button type="submit" disabled={submitting} className="bg-primary text-vault-950 font-semibold px-6 py-3 rounded-full disabled:opacity-50 flex items-center gap-2">
        <Check className="size-4" /> {submitting ? "Creating…" : "Create Listing"}
      </button>
    </form>
  );
}

const inputCls = "mt-1 w-full bg-vault-950 ring-1 ring-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-primary/50";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs uppercase tracking-wider text-vault-400 font-semibold">{label}{children}</label>;
}
