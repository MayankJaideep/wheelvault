CREATE OR REPLACE FUNCTION public.enforce_auction_has_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  img_count INT;
BEGIN
  SELECT COALESCE(array_length(image_urls, 1), 0)
    INTO img_count
  FROM public.listings
  WHERE id = NEW.listing_id;

  IF img_count IS NULL OR img_count < 1 THEN
    RAISE EXCEPTION 'Cannot start an auction: listing must have at least one photo uploaded'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_auction_has_photos ON public.auctions;
CREATE TRIGGER trg_enforce_auction_has_photos
BEFORE INSERT ON public.auctions
FOR EACH ROW EXECUTE FUNCTION public.enforce_auction_has_photos();