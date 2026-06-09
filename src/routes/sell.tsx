import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createListing } from "@/lib/marketplace.functions";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Plus, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell — WheelVault" },
      { name: "description", content: "List your die-cast collectibles for sale on WheelVault." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const navigate = useNavigate();
  const createFn = useServerFn(createListing);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    brand: "",
    series: "",
    year: "",
    condition: "Mint",
    rarity: "",
    description: "",
    price: "",
    stock: "1",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createFn({
        data: {
          title: form.title,
          brand: form.brand || undefined,
          series: form.series || undefined,
          year: form.year ? parseInt(form.year) : undefined,
          condition: form.condition,
          rarity: form.rarity || undefined,
          description: form.description || undefined,
          price_cents: Math.round(parseFloat(form.price) * 100),
          image_urls: images,
          stock: parseInt(form.stock) || 1,
        },
      });
      navigate({ to: "/browse" });
    } catch (err: any) {
      if (err.message?.includes("Unauthorized")) {
        navigate({ to: "/auth" });
      } else {
        alert(err.message ?? "Failed to create listing");
      }
    } finally {
      setLoading(false);
    }
  }

  function addImage() {
    const url = prompt("Enter image URL (use a service like Imgur or paste a direct link):");
    if (url) setImages([...images, url]);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-display font-semibold mb-2">Sell Your Collection</h1>
      <p className="text-vault-400 text-sm mb-10">List your die-cast collectibles for thousands of buyers worldwide.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
            placeholder="e.g. 1969 Pink Beach Bomb"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Brand</label>
            <select
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground"
            >
              <option value="">Select brand</option>
              <option value="Hot Wheels">Hot Wheels</option>
              <option value="Matchbox">Matchbox</option>
              <option value="M2 Machines">M2 Machines</option>
              <option value="Greenlight">Greenlight</option>
              <option value="Auto World">Auto World</option>
              <option value="Johnny Lightning">Johnny Lightning</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Series</label>
            <input
              value={form.series}
              onChange={(e) => setForm({ ...form, series: e.target.value })}
              className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
              placeholder="e.g. RLC, HWC, Boulevard"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
              placeholder="e.g. 1969"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Condition *</label>
            <select
              required
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground"
            >
              <option>Mint</option>
              <option>Near Mint</option>
              <option>Carded</option>
              <option>Loose</option>
              <option>A+</option>
              <option>Grail</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Rarity</label>
            <select
              value={form.rarity}
              onChange={(e) => setForm({ ...form, rarity: e.target.value })}
              className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground"
            >
              <option value="">Select rarity</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Super Treasure Hunt">Super Treasure Hunt</option>
              <option value="RLC Exclusive">RLC Exclusive</option>
              <option value="Prototype">Prototype</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500 resize-none"
            placeholder="Describe the item condition, packaging, provenance..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Price (USD) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Stock</label>
            <input
              type="number"
              min="1"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2.5 px-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-vault-400 mb-1.5 block">Images</label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative size-24 rounded-lg overflow-hidden ring-1 ring-white/10">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 p-1 bg-vault-950/80 rounded-full text-vault-400 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addImage}
              className="size-24 rounded-lg border-2 border-dashed border-vault-700 flex items-center justify-center text-vault-500 hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="size-6" />
            </button>
          </div>
          <p className="text-xs text-vault-500 mt-2">Add image URLs. For best results, upload to an image host first.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-vault-950 font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          List Item for Sale
        </button>
      </form>
    </div>
  );
}
