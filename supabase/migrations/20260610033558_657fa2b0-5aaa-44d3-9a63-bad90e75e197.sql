
-- Loosen seller FK so we can seed showcase listings
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_seller_id_fkey;

CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  starting_cents INTEGER NOT NULL CHECK (starting_cents >= 0),
  current_bid_cents INTEGER NOT NULL CHECK (current_bid_cents >= 0),
  min_increment_cents INTEGER NOT NULL DEFAULT 5000,
  leading_bidder_id UUID,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'live',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.auctions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.auctions TO authenticated;
GRANT ALL ON public.auctions TO service_role;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY auctions_select_all ON public.auctions FOR SELECT USING (true);
CREATE TRIGGER auctions_set_updated_at BEFORE UPDATE ON public.auctions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bids TO anon;
GRANT SELECT, INSERT ON public.bids TO authenticated;
GRANT ALL ON public.bids TO service_role;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY bids_select_all ON public.bids FOR SELECT USING (true);
CREATE POLICY bids_insert_own ON public.bids FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

INSERT INTO public.listings (id, seller_id, title, brand, series, year, condition, rarity, description, price_cents, image_urls, stock, status) VALUES
('11111111-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Nissan Skyline GT-R R34 V-Spec','Hot Wheels','Fast & Furious',2023,'mint','Super Treasure Hunt','Iconic Bayside Blue R34 with real riders and spectraflame paint. Mint on unpunched card.',249900,ARRAY['https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop'],1,'active'),
('11111111-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Datsun 510 Wagon Custom','Hot Wheels','Car Culture',2022,'mint','Premium','Premium Car Culture series with metal body, metal chassis, and real rider wheels.',189900,ARRAY['https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=800&h=600&fit=crop'],3,'active'),
('11111111-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','Porsche 911 GT3 RS','Hot Wheels','Exotic Envy',2024,'mint','Mainline','Bright orange Porsche with carbon-fiber accents. Sealed mainline blister.',49900,ARRAY['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'],8,'active'),
('11111111-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','Lamborghini Countach LP 5000 QV','Hot Wheels','Exotics',2023,'mint','RLC Exclusive','Red Line Club exclusive numbered 0042/5000. Acrylic display case included.',529900,ARRAY['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop'],1,'active'),
('11111111-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','Toyota AE86 Sprinter Trueno','Hot Wheels','J-Imports',2021,'near-mint','Treasure Hunt','Panda livery AE86. Card has a small bend on the upper-right corner.',149900,ARRAY['https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop'],2,'active'),
('11111111-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','Ford GT40 Mk II','Hot Wheels','Le Mans Legends',2022,'mint','Premium','Gulf-livery GT40 in racing trim. Premium series with rubber tires.',229900,ARRAY['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop'],4,'active'),
('11111111-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','Mazda RX-7 FD3S Veilside','Hot Wheels','Fast & Furious',2024,'mint','Premium','The Tokyo Drift Veilside RX-7 in full kit. Highly sought-after JDM premium.',279900,ARRAY['https://images.unsplash.com/photo-1607853554439-0069ec0f29b6?w=800&h=600&fit=crop'],2,'active'),
('11111111-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','Honda Civic EG6 SiR-II','Hot Wheels','Car Culture',2023,'mint','Mainline','Clean white EG6 hatchback with stance and JDM details.',39900,ARRAY['https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&h=600&fit=crop'],10,'active'),
('11111111-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','BMW M3 E30 ''88','Hot Wheels','Modern Classics',2022,'mint','Premium','Iconic E30 M3 in Alpine White. Real rider basketweave wheels.',169900,ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop'],3,'active'),
('11111111-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','Chevrolet Bel Air Gasser','Hot Wheels','Drag Strip Demons',2021,'good','Mainline','Pre-owned gasser with classic stance. Loose, no card.',29900,ARRAY['https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&h=600&fit=crop'],5,'active'),
('11111111-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','Lancia Stratos HF','Hot Wheels','Rally Legends',2024,'mint','Premium','Alitalia-livery Stratos rally icon. Premium with rubber tires.',219900,ARRAY['https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=600&fit=crop'],3,'active'),
('11111111-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','Audi Quattro Sport','Hot Wheels','Rally Legends',2023,'mint','Mainline','Group B icon in classic white-and-red livery.',44900,ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop'],6,'active'),
('11111111-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000001','Ferrari F40','Hot Wheels','Exotics',2024,'mint','Premium','Iconic Rosso Corsa F40. Premium with real rider wheels and metal body.',319900,ARRAY['https://images.unsplash.com/photo-1614026480209-cb91a8800a73?w=800&h=600&fit=crop'],2,'active'),
('11111111-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000001','Volkswagen Golf Mk2 GTI','Hot Wheels','Modern Classics',2022,'mint','Mainline','Boxy Mk2 GTI in tornado red. Mainline blister mint.',34900,ARRAY['https://images.unsplash.com/photo-1610465299993-e6675c9f9efa?w=800&h=600&fit=crop'],9,'active'),
('11111111-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000001','McLaren P1','Hot Wheels','Hypercar',2024,'mint','Premium','Volcano Orange McLaren P1 in premium trim.',259900,ARRAY['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&h=600&fit=crop'],3,'active'),
('11111111-0000-0000-0000-000000000016','00000000-0000-0000-0000-000000000001','Subaru Impreza WRX STI ''98','Hot Wheels','J-Imports',2023,'mint','Treasure Hunt','555 Rally livery Impreza. Treasure Hunt with TH flame.',199900,ARRAY['https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=800&h=600&fit=crop'],2,'active');

INSERT INTO public.auctions (listing_id, starting_cents, current_bid_cents, min_increment_cents, ends_at, status) VALUES
('11111111-0000-0000-0000-000000000001',199900,249900,10000,now() + interval '2 days','live'),
('11111111-0000-0000-0000-000000000004',399900,529900,25000,now() + interval '6 hours','live'),
('11111111-0000-0000-0000-000000000007',179900,279900,10000,now() + interval '18 hours','live'),
('11111111-0000-0000-0000-000000000013',249900,319900,10000,now() + interval '3 days','live'),
('11111111-0000-0000-0000-000000000005',79900,149900,5000,now() + interval '1 day','live'),
('11111111-0000-0000-0000-000000000011',129900,219900,10000,now() + interval '12 hours','live');

ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
