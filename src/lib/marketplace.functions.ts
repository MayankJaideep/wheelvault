import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  brand: string | null;
  series: string | null;
  year: number | null;
  condition: string;
  rarity: string | null;
  description: string | null;
  price_cents: number;
  image_urls: string[];
  stock: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  listing_id: string;
  qty: number;
  created_at: string;
  listings?: Listing | null;
};

export type Auction = {
  id: string;
  listing_id: string;
  starting_cents: number;
  current_bid_cents: number;
  min_increment_cents: number;
  leading_bidder_id: string | null;
  ends_at: string;
  status: string;
  created_at: string;
  updated_at: string;
  listings?: Listing | null;
};

export type Bid = {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount_cents: number;
  created_at: string;
};

// ---------- LISTINGS ----------
export const getListings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return { listings: (data ?? []) as Listing[] };
});

export const getListing = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: listing, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("id", data)
      .single();
    if (error) throw error;
    return { listing: listing as Listing };
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    title: string;
    brand?: string;
    series?: string;
    year?: number;
    condition: string;
    rarity?: string;
    description?: string;
    price_cents: number;
    image_urls: string[];
    stock?: number;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: listing, error } = await supabase
      .from("listings")
      .insert({ seller_id: userId, ...data })
      .select()
      .single();
    if (error) throw error;
    return { listing: listing as Listing };
  });

// ---------- CART ----------
export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("cart_items")
      .select("*, listings(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { cart: (data ?? []) as unknown as CartItem[] };
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { listing_id: string; qty: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: item, error } = await supabase
      .from("cart_items")
      .upsert({ user_id: userId, listing_id: data.listing_id, qty: data.qty }, { onConflict: "user_id, listing_id" })
      .select()
      .single();
    if (error) throw error;
    return { item: item as CartItem };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((cartItemId: string) => cartItemId)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("cart_items").delete().eq("id", data).eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------- PROFILE ----------
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return { profile: data };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    display_name?: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").upsert({ id: userId, ...data });
    if (error) throw error;
    return { ok: true };
  });

export const getMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { listings: (data ?? []) as Listing[] };
  });

// ---------- AUCTIONS ----------
export const getAuctions = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("auctions")
    .select("*, listings(*)")
    .eq("status", "live")
    .order("ends_at", { ascending: true });
  if (error) throw error;
  return { auctions: (data ?? []) as unknown as Auction[] };
});

export const getAuction = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: auction, error } = await supabaseAdmin
      .from("auctions")
      .select("*, listings(*)")
      .eq("id", data)
      .single();
    if (error) throw error;
    const { data: bids } = await supabaseAdmin
      .from("bids")
      .select("*")
      .eq("auction_id", data)
      .order("amount_cents", { ascending: false })
      .limit(20);
    return { auction: auction as unknown as Auction, bids: (bids ?? []) as Bid[] };
  });

export const placeBid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { auction_id: string; amount_cents: number }) => input)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: auction, error: aErr } = await supabaseAdmin
      .from("auctions")
      .select("*")
      .eq("id", data.auction_id)
      .single();
    if (aErr || !auction) throw new Error("Auction not found");
    if (auction.status !== "live") throw new Error("Auction is not live");
    if (new Date(auction.ends_at).getTime() < Date.now()) throw new Error("Auction has ended");

    const minNext = auction.current_bid_cents + auction.min_increment_cents;
    if (data.amount_cents < minNext) {
      throw new Error(`Bid must be at least ₹${(minNext / 100).toLocaleString("en-IN")}`);
    }

    const { error: bidErr } = await supabaseAdmin.from("bids").insert({
      auction_id: data.auction_id,
      bidder_id: userId,
      amount_cents: data.amount_cents,
    });
    if (bidErr) throw bidErr;

    const { error: updErr } = await supabaseAdmin
      .from("auctions")
      .update({ current_bid_cents: data.amount_cents, leading_bidder_id: userId })
      .eq("id", data.auction_id);
    if (updErr) throw updErr;

    return { ok: true, current_bid_cents: data.amount_cents };
  });

// ---------- ORDERS / CHECKOUT (cash-on-delivery demo) ----------
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { shipping_address: { name: string; line1: string; city: string; pincode: string; phone: string } }) => input)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cartRows, error: cErr } = await supabaseAdmin
      .from("cart_items")
      .select("*, listings(*)")
      .eq("user_id", userId);
    if (cErr) throw cErr;
    if (!cartRows || cartRows.length === 0) throw new Error("Cart is empty");

    const items = cartRows as unknown as CartItem[];
    const total = items.reduce((s, i) => s + (i.listings?.price_cents ?? 0) * i.qty, 0);

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: userId,
        total_cents: total,
        status: "placed",
        shipping_address: data.shipping_address,
      })
      .select()
      .single();
    if (oErr) throw oErr;

    const orderItems = items.map((i) => ({
      order_id: order.id,
      listing_id: i.listing_id,
      seller_id: i.listings?.seller_id ?? userId,
      title_snapshot: i.listings?.title ?? "Item",
      image_snapshot: i.listings?.image_urls?.[0] ?? null,
      price_cents: i.listings?.price_cents ?? 0,
      qty: i.qty,
    }));
    await supabaseAdmin.from("order_items").insert(orderItems);
    await supabaseAdmin.from("cart_items").delete().eq("user_id", userId);

    return { order_id: order.id, total_cents: total };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { orders: data ?? [] };
  });
