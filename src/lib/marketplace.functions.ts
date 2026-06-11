import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

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
  image_urls: string[]; // signed URLs after signing; raw paths in DB
  stock: number;
  status: string;
  featured: boolean;
  is_banner: boolean;
  sale_type: string;
  created_at: string;
  updated_at: string;
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

export type Inquiry = {
  id: string;
  user_id: string | null;
  listing_id: string | null;
  auction_id: string | null;
  kind: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_pincode: string | null;
  amount_cents: number | null;
  notes: string | null;
  status: string;
  created_at: string;
};

// ------ image signing helpers (server-only) ------
async function signPaths(paths: string[]): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // External URLs (legacy) pass through; storage paths get signed.
  const out: string[] = [];
  for (const p of paths) {
    if (!p) continue;
    if (p.startsWith("http://") || p.startsWith("https://")) {
      out.push(p);
      continue;
    }
    const { data } = await supabaseAdmin.storage.from("listing-images").createSignedUrl(p, SIGNED_URL_TTL);
    if (data?.signedUrl) out.push(data.signedUrl);
  }
  return out;
}

async function signListings<T extends { image_urls: string[] | null }>(rows: T[]): Promise<T[]> {
  return Promise.all(
    rows.map(async (r) => ({ ...r, image_urls: await signPaths(r.image_urls ?? []) })),
  );
}

async function signAuctions(rows: any[]): Promise<any[]> {
  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      listings: r.listings ? { ...r.listings, image_urls: await signPaths(r.listings.image_urls ?? []) } : r.listings,
    })),
  );
}

// ---------- PUBLIC LISTINGS ----------
export const getListings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const signed = await signListings((data ?? []) as Listing[]);
  return { listings: signed };
});

export const getFeaturedListings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("status", "active")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;
  return { listings: await signListings((data ?? []) as Listing[]) };
});

export const getBanners = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("is_banner", true)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return { listings: await signListings((data ?? []) as Listing[]) };
});

export const getListing = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: listing, error } = await supabaseAdmin.from("listings").select("*").eq("id", data).single();
    if (error) throw error;
    const [signed] = await signListings([listing as Listing]);
    return { listing: signed };
  });

// ---------- PUBLIC AUCTIONS ----------
export const getAuctions = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("auctions")
    .select("*, listings(*)")
    .eq("status", "live")
    .order("ends_at", { ascending: true });
  if (error) throw error;
  return { auctions: (await signAuctions(data ?? [])) as Auction[] };
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
    const [signed] = await signAuctions([auction]);
    const { data: bids } = await supabaseAdmin
      .from("bids")
      .select("*")
      .eq("auction_id", data)
      .order("amount_cents", { ascending: false })
      .limit(50);
    return { auction: signed as Auction, bids: (bids ?? []) as Bid[] };
  });

// ---------- BIDDING ----------
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
    await supabaseAdmin
      .from("auctions")
      .update({ current_bid_cents: data.amount_cents, leading_bidder_id: userId })
      .eq("id", data.auction_id);
    return { ok: true, current_bid_cents: data.amount_cents };
  });

// ---------- INQUIRIES (WhatsApp lead capture) ----------
export const createInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    listing_id?: string;
    auction_id?: string;
    kind: "buy" | "auction_win" | "reserve";
    buyer_name: string;
    buyer_phone: string;
    buyer_address: string;
    buyer_pincode?: string;
    amount_cents?: number;
    notes?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("inquiries")
      .insert({
        user_id: userId,
        listing_id: data.listing_id ?? null,
        auction_id: data.auction_id ?? null,
        kind: data.kind,
        buyer_name: data.buyer_name,
        buyer_phone: data.buyer_phone,
        buyer_address: data.buyer_address,
        buyer_pincode: data.buyer_pincode ?? null,
        amount_cents: data.amount_cents ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    // Mark listing as reserved if a buy/reserve was placed
    if (data.kind !== "auction_win" && data.listing_id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("listings").update({ status: "reserved" }).eq("id", data.listing_id);
    }
    return { inquiry: row as Inquiry };
  });

export const getMyInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { inquiries: (data ?? []) as Inquiry[] };
  });

// ---------- PROFILE ----------
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    return { profile: data, isAdmin };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { display_name?: string; bio?: string; location?: string; avatar_url?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").upsert({ id: userId, ...data });
    if (error) throw error;
    return { ok: true };
  });

// ---------- ADMIN: LISTINGS ----------
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminCreateListing = createServerFn({ method: "POST" })
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
    featured?: boolean;
    is_banner?: boolean;
    sale_type?: "fixed" | "auction";
    status?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        seller_id: userId,
        title: data.title,
        brand: data.brand ?? null,
        series: data.series ?? null,
        year: data.year ?? null,
        condition: data.condition,
        rarity: data.rarity ?? null,
        description: data.description ?? null,
        price_cents: data.price_cents,
        image_urls: data.image_urls,
        stock: data.stock ?? 1,
        status: data.status ?? "active",
        featured: data.featured ?? false,
        is_banner: data.is_banner ?? false,
        sale_type: data.sale_type ?? "fixed",
      })
      .select()
      .single();
    if (error) throw error;
    return { listing };
  });

export const adminUpdateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; patch: Partial<Listing> }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("listings").update(data.patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("listings").delete().eq("id", data);
    if (error) throw error;
    return { ok: true };
  });

export const adminCreateAuction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    listing_id: string;
    starting_cents: number;
    min_increment_cents: number;
    ends_at: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: auction, error } = await supabase
      .from("auctions")
      .insert({
        listing_id: data.listing_id,
        starting_cents: data.starting_cents,
        current_bid_cents: data.starting_cents,
        min_increment_cents: data.min_increment_cents,
        ends_at: data.ends_at,
        status: "live",
      })
      .select()
      .single();
    if (error) throw error;
    await supabase.from("listings").update({ sale_type: "auction" }).eq("id", data.listing_id);
    return { auction };
  });

export const adminEndAuction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    await supabase.from("auctions").update({ status: "ended" }).eq("id", data);
    return { ok: true };
  });

export const adminGetInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("inquiries")
      .select("*, listings(title), auctions(id)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return { inquiries: (data ?? []) as any[] };
  });

export const adminUpdateInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    await supabase.from("inquiries").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

export const adminGetAuctions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("auctions")
      .select("*, listings(title, image_urls)")
      .order("ends_at", { ascending: true });
    if (error) throw error;
    return { auctions: (data ?? []) as any[] };
  });
