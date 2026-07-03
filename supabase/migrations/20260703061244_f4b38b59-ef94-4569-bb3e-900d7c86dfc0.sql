CREATE INDEX IF NOT EXISTS auctions_status_ends_at_idx ON public.auctions (status, ends_at);
CREATE INDEX IF NOT EXISTS auctions_listing_status_ends_at_idx ON public.auctions (listing_id, status, ends_at);
CREATE INDEX IF NOT EXISTS bids_auction_amount_idx ON public.bids (auction_id, amount_cents DESC);
CREATE INDEX IF NOT EXISTS bids_auction_created_idx ON public.bids (auction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON public.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_listing_id_idx ON public.inquiries (listing_id);
CREATE INDEX IF NOT EXISTS listings_featured_created_idx ON public.listings (featured, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_banner_created_idx ON public.listings (is_banner, created_at DESC);
DROP POLICY IF EXISTS "auctions_select_all" ON public.auctions;