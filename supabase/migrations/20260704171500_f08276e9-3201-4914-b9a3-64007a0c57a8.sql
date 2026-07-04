DROP POLICY IF EXISTS "anyone reads auctions" ON public.auctions;
DROP POLICY IF EXISTS "auctions_select_all" ON public.auctions;

CREATE POLICY "authenticated reads auctions"
ON public.auctions FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.auctions FROM anon;