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
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type CartItem = {
  id: string;
  user_id: string;
  listing_id: string;
  qty: number;
  created_at: string;
  listings?: Listing | null;
};

// Get all active listings
export const getListings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client.server").then(m => m.supabaseAdmin);
  const { data, error } = await supabase
    .from("listings")
    .select(
      `*, profiles: seller_id(display_name, avatar_url)`
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return { listings: (data ?? []) as Listing[] };
});

// Get single listing
export const getListing = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: listing, error } = await supabaseAdmin
      .from("listings")
      .select(`*, profiles: seller_id(display_name, avatar_url)`)
      .eq("id", data)
      .single();
    if (error) throw error;
    return { listing: listing as Listing };
  });

// Create listing
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
      .insert({
        seller_id: userId,
        ...data,
      })
      .select()
      .single();
    if (error) throw error;
    return { listing: listing as Listing };
  });

// Get user's cart
export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("cart_items")
      .select(`*, listings!inner(*, profiles: seller_id(display_name, avatar_url))`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { cart: (data ?? []) as CartItem[] };
  });

// Add to cart
export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { listing_id: string; qty: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: item, error } = await supabase
      .from("cart_items")
      .upsert({
        user_id: userId,
        listing_id: data.listing_id,
        qty: data.qty,
      }, { onConflict: "user_id, listing_id" })
      .select()
      .single();
    if (error) throw error;
    return { item: item as CartItem };
  });

// Remove from cart
export const removeFromCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((cartItemId: string) => cartItemId)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", data)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

// Get user's profile
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return { profile: data };
  });

// Update profile
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
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId);
    if (error) throw error;
    return { ok: true };
  });

// Get seller's own listings
export const getMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("listings")
      .select(`*, profiles: seller_id(display_name, avatar_url)`)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { listings: (data ?? []) as Listing[] };
  });

// Update listing status
export const updateListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { listing_id: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("listings")
      .update({ status: data.status })
      .eq("id", data.listing_id)
      .eq("seller_id", userId);
    if (error) throw error;
    return { ok: true };
  });
