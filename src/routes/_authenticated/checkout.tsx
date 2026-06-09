import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { getCart } from "@/lib/marketplace.functions";
import { CreditCard, ArrowLeft, Shield, Truck } from "lucide-react";

const cartQueryOptions = queryOptions({
  queryKey: ["cart"],
  queryFn: () => getCart(),
});

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — WheelVault" },
      { name: "description", content: "Complete your purchase on WheelVault." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(cartQueryOptions);
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const { data } = useQuery(cartQueryOptions);
  const cart = data?.cart ?? [];
  const navigate = useNavigate();

  const totalCents = cart.reduce((sum, item) => sum + ((item.listings?.price_cents ?? 0) * item.qty), 0);
  const total = (totalCents / 100).toFixed(2);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button onClick={() => navigate({ to: "/_authenticated/cart" })} className="inline-flex items-center gap-2 text-sm text-vault-400 hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="size-4" />
        Back to cart
      </button>

      <h1 className="text-3xl font-display font-semibold mb-2">Checkout</h1>
      <p className="text-vault-400 text-sm mb-10">Secure payment powered by Stripe.</p>

      {cart.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-vault-400">Your cart is empty.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-vault-900/50 rounded-xl p-6 ring-1 ring-white/5">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-vault-400">{item.listings?.title} x{item.qty}</span>
                  <span className="font-medium">${(((item.listings?.price_cents ?? 0) * item.qty) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 my-4" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">${total}</span>
            </div>
          </div>

          <div className="bg-vault-900/50 rounded-xl p-6 ring-1 ring-white/5">
            <h3 className="font-semibold mb-4">Payment</h3>
            <p className="text-sm text-vault-400 mb-6">
              Stripe checkout will be integrated here. For now, this is a placeholder for the payment flow.
            </p>
            <button
              disabled
              className="w-full bg-primary text-vault-950 font-semibold py-3 rounded-lg opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="size-4" />
              Pay with Stripe (Coming Soon)
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-xs text-vault-500">
            <span className="flex items-center gap-1"><Shield className="size-3" /> SSL Encrypted</span>
            <span className="flex items-center gap-1"><Truck className="size-3" /> Insured Shipping</span>
          </div>
        </div>
      )}
    </div>
  );
}
