
-- 1. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 2. Auto-promote admin email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'mayankjaideep07@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = 'mayankjaideep07@gmail.com'
ON CONFLICT DO NOTHING;

-- 3. Clear demo data
DELETE FROM public.bids;
DELETE FROM public.auctions;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.cart_items;
DELETE FROM public.listings;

DROP TABLE IF EXISTS public.cart_items CASCADE;

-- 4. Listings: flags + admin-only writes
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_type text NOT NULL DEFAULT 'fixed';

DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
DROP POLICY IF EXISTS "Users can create their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;

CREATE POLICY "anyone reads listings" ON public.listings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin inserts listings" ON public.listings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin updates listings" ON public.listings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin deletes listings" ON public.listings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.listings TO anon;

-- 5. Auctions: admin-only writes
DROP POLICY IF EXISTS "Auctions viewable by everyone" ON public.auctions;
CREATE POLICY "anyone reads auctions" ON public.auctions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manages auctions" ON public.auctions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.auctions TO anon;

-- 6. Inquiries (WhatsApp lead capture)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  auction_id uuid REFERENCES public.auctions(id) ON DELETE SET NULL,
  kind text NOT NULL,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_address text NOT NULL,
  buyer_pincode text,
  amount_cents bigint,
  notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own inquiries" ON public.inquiries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users read own inquiries" ON public.inquiries
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin updates inquiries" ON public.inquiries
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS tg_inquiries_updated ON public.inquiries;
CREATE TRIGGER tg_inquiries_updated BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 7. Storage policies (bucket public flag set via tool)
DROP POLICY IF EXISTS "public read listing images" ON storage.objects;
DROP POLICY IF EXISTS "admin write listing images" ON storage.objects;
DROP POLICY IF EXISTS "admin update listing images" ON storage.objects;
DROP POLICY IF EXISTS "admin delete listing images" ON storage.objects;

CREATE POLICY "public read listing images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'listing-images');
CREATE POLICY "admin write listing images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update listing images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'listing-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete listing images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'listing-images' AND public.has_role(auth.uid(), 'admin'));
