DROP POLICY IF EXISTS "bids_select_all" ON public.bids;
CREATE POLICY "bids_select_authenticated" ON public.bids FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "listings_insert_own" ON public.listings;
DROP POLICY IF EXISTS "listings_update_own" ON public.listings;
DROP POLICY IF EXISTS "listings_delete_own" ON public.listings;
DROP POLICY IF EXISTS "listings_select_active_or_own" ON public.listings;