import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCart, removeFromCart } from "@/lib/marketplace.functions";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight } from "lucide-react";

const cartQueryOptions = queryOptions({
  queryKey: ["cart"],
  queryFn: () => getCart(),
});

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Cart — WheelVault" },
      { name: "description", content: "Your cart on WheelVault." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQueryOptions),
  component: CartPage,
});

function CartPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery(cartQueryOptions);
  const cart = data?.cart ?? [];
  const removeFn = useServerFn(removeFromCart);
  const navigate = useNavigate();

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFn({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const totalCents = cart.reduce((sum, item) => sum + ((item.listings?.price_cents ?? 0) * item.qty), 0);
  const total = (totalCents / 100).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-display font-semibold mb-2">Your Cart</h1>
      <p className="text-vault-400 text-sm mb-10">{cart.length} {cart.length === 1 ? "item" : "items"}</p>

      {cart.length === 0 ? (
        <div className="py-24 text-center">
          <ShoppingCart className="size-12 mx-auto text-vault-700 mb-4" />
          <p className="text-vault-400 mb-6">Your cart is empty.</p>
          <Link to="/browse" className="inline-flex items-center gap-2 bg-primary text-vault-950 font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
            Start Browsing <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 bg-vault-900/50 rounded-xl p-4 ring-1 ring-white/5">
                <div className="size-24 bg-vault-800 rounded-lg overflow-hidden shrink-0">
                  {item.listings?.image_urls?.[0] ? (
                    <img src={item.listings.image_urls[0]} alt={item.listings.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-vault-600">
                      <ShoppingCart className="size-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.listings?.title}</h3>
                  <p className="text-xs text-vault-500">{item.listings?.brand} {item.listings?.series ? `· ${item.listings.series}` : ""}</p>
                  <p className="text-sm font-semibold text-primary mt-1">${((item.listings?.price_cents ?? 0) / 100).toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    className="p-2 text-vault-500 hover:text-destructive transition-colors"
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-vault-800 rounded-lg px-3 py-1">
                    <span className="text-sm font-medium">{item.qty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="bg-vault-900/50 rounded-xl p-6 ring-1 ring-white/5 sticky top-24">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="flex justify-between text-sm text-vault-400 mb-2">
                <span>Subtotal</span>
                <span>${total}</span>
              </div>
              <div className="flex justify-between text-sm text-vault-400 mb-2">
                <span>Shipping</span>
                <span>{totalCents >= 5000 ? "Free" : "$4.99"}</span>
              </div>
              <div className="border-t border-white/5 my-4" />
              <div className="flex justify-between font-semibold text-lg mb-6">
                <span>Total</span>
                <span>${totalCents >= 5000 ? total : (totalCents / 100 + 4.99).toFixed(2)}</span>
              </div>
              <button
                onClick={() => navigate({ to: "/_authenticated/checkout" })}
                className="w-full bg-primary text-vault-950 font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
