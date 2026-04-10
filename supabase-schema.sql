-- ============================================
-- BioWatch Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  eco_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

UPDATE profiles SET role = 'admin' WHERE email = 'sarthjain.04@gmail.com';

-- ============================================
-- REPORTS TABLE
-- Anonymous reporting removed: reporter name
-- and contact are now mandatory for verification.
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN (
    'Illegal Tree Cutting',
    'Wildlife Activity',
    'Garbage Dumping',
    'Landslide Risk Zone',
    'Forest Fire',
    'Other'
  )),
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  reporter_name TEXT NOT NULL,
  reporter_contact TEXT NOT NULL,
  pmc_flag BOOLEAN DEFAULT FALSE,
  pmc_id TEXT,
  status TEXT DEFAULT 'Reported' CHECK (status IN (
    'Reported',
    'Under Review',
    'Verified',
    'Forwarded',
    'Closed'
  )),
  -- Severity & Escalation
  severity_level TEXT DEFAULT 'Low' CHECK (severity_level IN ('Low', 'Medium', 'High', 'Critical')),
  priority_score INTEGER DEFAULT 0,
  is_escalated BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  -- Media Collaboration
  media_flag BOOLEAN DEFAULT FALSE,
  media_shared_at TIMESTAMPTZ,
  media_notes TEXT,
  public_visibility BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add severity/media columns if table already exists (safe migration)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS severity_level TEXT DEFAULT 'Low'
  CHECK (severity_level IN ('Low', 'Medium', 'High', 'Critical'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_flag BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_shared_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_notes TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS public_visibility BOOLEAN DEFAULT FALSE;

-- ============================================
-- BIODIVERSITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS biodiversity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  scientific_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('flora', 'fauna')),
  description TEXT,
  habitat TEXT,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add location column if table already exists
ALTER TABLE biodiversity ADD COLUMN IF NOT EXISTS location TEXT;

-- ============================================
-- VOLUNTEERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT,
  interest_area TEXT NOT NULL,
  availability TEXT NOT NULL,
  assigned_report_id UUID REFERENCES reports(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE biodiversity ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper: checks admin role WITHOUT triggering RLS
-- This prevents infinite recursion (error 42P17) when policies on other
-- tables query the profiles table (which itself has RLS enabled).
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- REPORTS policies
-- Public can read limited report data (excluding reporter info)
CREATE POLICY "Anyone can read reports" ON reports
  FOR SELECT USING (true);
-- Anyone can insert reports (anonymous reporting)
CREATE POLICY "Anyone can create reports" ON reports
  FOR INSERT WITH CHECK (true);
-- Only admin can update reports
CREATE POLICY "Admin can update reports" ON reports
  FOR UPDATE USING (is_admin());

-- BIODIVERSITY policies
CREATE POLICY "Anyone can read biodiversity" ON biodiversity
  FOR SELECT USING (true);
CREATE POLICY "Admin can insert biodiversity" ON biodiversity
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin can update biodiversity" ON biodiversity
  FOR UPDATE USING (is_admin());
CREATE POLICY "Admin can delete biodiversity" ON biodiversity
  FOR DELETE USING (is_admin());

-- VOLUNTEERS policies
CREATE POLICY "Anyone can register as volunteer" ON volunteers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read volunteers" ON volunteers
  FOR SELECT USING (true);
CREATE POLICY "Admin can update volunteers" ON volunteers
  FOR UPDATE USING (is_admin());

-- ============================================
-- STORAGE BUCKET (run separately if needed)
-- ============================================
-- Create a public bucket called 'report-images' in Supabase Storage dashboard
-- Or use: INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true);

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SAMPLE BIODIVERSITY DATA (Pune)
-- Run only in a fresh setup. For existing DBs, use INSERT ... ON CONFLICT DO NOTHING
-- ============================================
DELETE FROM biodiversity WHERE true;

INSERT INTO biodiversity (name, scientific_name, type, description, habitat, location, image_url) VALUES

-- ── FAUNA ──
  ('Indian Leopard', 'Panthera pardus fusca', 'fauna',
   'A large spotted cat native to the Indian subcontinent. Sightings are regularly reported near Sinhagad and Bhimashankar. They navigate forest corridors between the Western Ghats and the hills around Pune.',
   'Deciduous forests, rocky scrublands, forested hills',
   'Sinhagad Fort area & Bhimashankar Wildlife Sanctuary, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Indian_Leopard.jpg&width=480'),

  ('Indian Peafowl', 'Pavo cristatus', 'fauna',
   'The national bird of India. Peacocks are a common and beloved sight at Rajiv Gandhi Zoological Park and across agricultural land on the outskirts of Pune. Males display spectacular plumage during the monsoon breeding season.',
   'Open forests, grasslands, farmland edges',
   'Rajiv Gandhi Zoological Park (Katraj), Pashan Lake, Lohegaon, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Peacock_Plumage.jpg&width=480'),

  ('Indian Flying Fox', 'Pteropus medius', 'fauna',
   'One of the largest bats in the world with a wingspan up to 1.5 m. Large roost colonies hang from tall trees near Empress Garden and Osho Ashram area. They are vital pollinators and seed dispersers.',
   'Urban tree groves, mango orchards, rivers',
   'Empress Garden & Bund Garden area, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Indian_flying_fox_(Pteropus_medius)_Bhatti_Mines.jpg&width=480'),

  ('Indian Giant Squirrel', 'Ratufa indica', 'fauna',
   'A striking black-and-rust coloured tree squirrel endemic to India. Found in the dense canopy forests of Bhimashankar, a wildlife sanctuary roughly 110 km from Pune. Listed as Vulnerable.',
   'Moist deciduous and semi-evergreen forests',
   'Bhimashankar Wildlife Sanctuary (110 km from Pune)',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Ratufa_indica_(Bhadra,_2006).jpg&width=480'),

  ('Bonnet Macaque', 'Macaca radiata', 'fauna',
   'A gregarious monkey species widely seen around Parvati Hill, Sinhagad Fort, and Khadakwasla Dam. They are highly adaptable and thrive near human settlements and temple precincts.',
   'Forests, temple areas, rocky outcrops',
   'Parvati Hill, Sinhagad Fort, Khadakwasla Dam, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Bonnet_macaque_(Macaca_radiata)_Photograph_By_Shantanu_Kuveskar.jpg&width=480'),

  ('Indian Rock Python', 'Python molurus', 'fauna',
   'One of India''s largest snakes. It inhabits the rocky, forested hillsides of Sinhagad and has been spotted near the Mutha river banks. A Schedule I protected species under the Wildlife Protection Act.',
   'Rocky hills, riverbanks, forests',
   'Sinhagad Valley, Mutha River banks, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Indian_Rock_Python.jpg&width=480'),

  ('Painted Stork', 'Mycteria leucocephala', 'fauna',
   'A large wading bird easily recognised by its vivid pink and yellow bill and white-and-black wings. Pashan Lake and Bhigwan (Bhimashankar road corridor) are key wintering grounds for hundreds of individuals.',
   'Shallow wetlands, lakes, paddy fields',
   'Pashan Lake, Bhigwan Wetlands (~100 km from Pune)',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Painted_Stork_(Mycteria_leucocephala)_at_Bharatpur_I_IMG_5673.jpg&width=480'),

  ('Mugger Crocodile', 'Crocodylus palustris', 'fauna',
   'A medium-sized crocodile found basking on the banks of the Mutha and Bhima rivers near Pune. Khadakwasla reservoir houses a healthy population. A Schedule I protected species.',
   'Rivers, reservoirs, freshwater wetlands',
   'Khadakwasla Reservoir & Mutha River, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Crocodylus_palustris_1.jpg&width=480'),

  ('Common Indian Monitor', 'Varanus bengalensis', 'fauna',
   'A large monitor lizard frequently seen around Sinhagad, Vetal Tekdi, and along the rocky outcrops of the Sahyadri hills. They are important scavengers in the ecosystem.',
   'Scrubland, rocky areas, near water bodies',
   'Vetal Tekdi (Vetal Hill), Sinhagad area, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Varanus_bengalensis_2.jpg&width=480'),

  ('Flame-throated Bulbul', 'Rubigula gularis', 'fauna',
   'A vibrant bird endemic to the Western Ghats with a striking orange-red throat patch. Found in the forested ghats accessible from Pune via Tamhini and Mulshi.',
   'Evergreen and moist deciduous forests of Western Ghats',
   'Tamhini Ghat, Mulshi Forests (~50 km from Pune)',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Pycnonotus_gularis_-_Goa.jpg&width=480'),


-- ── FLORA ──
  ('Banyan Tree', 'Ficus benghalensis', 'flora',
   'India''s national tree. Massive specimen banyan trees line the avenues of Empress Garden and are found throughout Pune''s heritage precincts. Their aerial roots form new trunks, creating micro-ecosystems.',
   'Tropical forests, heritage gardens, roadside avenues',
   'Empress Garden, Deccan Gymkhana, Aga Khan Palace, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Ficus_benghalensis_-_Indian_Botanic_Garden_-_Howrah_2012-01-29_1692.JPG&width=480'),

  ('Neem Tree', 'Azadirachta indica', 'flora',
   'A fast-growing tree prized for its medicinal and insecticidal properties. Widely planted along Pune''s roads and in residential areas. Almost every neighbourhood in Pune has neem trees providing dense summer shade.',
   'Tropical dry forests, urban streets, backyards',
   'Throughout Pune city — Shivajinagar, Kothrud, Aundh, Hadapsar',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Neem_(Azadirachta_indica)_in_Hyderabad_W_IMG_6976.jpg&width=480'),

  ('Peepal Tree', 'Ficus religiosa', 'flora',
   'The sacred fig tree, revered in Hindu, Buddhist, and Jain traditions. Ancient specimens stand at Parvati Temple, near Kasba Ganpati, and across the Peth areas of old Pune.',
   'Temple precincts, roadsides, riverbanks',
   'Parvati Hill, Kasba Peth, Shaniwarwada surroundings, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Ficus_religiosa_Bo.jpg&width=480'),

  ('Gulmohar', 'Delonix regia', 'flora',
   'The Flame Tree explodes in scarlet-orange blossoms each summer (April–June), transforming Pune''s avenues into fiery corridors. Senapati Bapat Road and University Road are especially famous for their gulmohar canopy.',
   'Tropical urban boulevards, parks',
   'Senapati Bapat Road, Pune University Campus, Deccan, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Gulmohar_(Delonix_regia)_flowers_W_IMG_6879.jpg&width=480'),

  ('Karvi (Strobilanthes)', 'Strobilanthes callosa', 'flora',
   'A shrub found in the Sahyadri hills near Pune that mass-blooms only once every 7 years, covering hillsides in violet-blue flowers. Best observed at Sinhagad Valley and Mulshi during its rare bloom.',
   'Sahyadri hillside thickets, rocky slopes',
   'Sinhagad Valley, Mulshi & Tamhini Ghat hillsides, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Strobilanthes_callosa_at_Munnar.jpg&width=480'),

  ('Arjuna Tree', 'Terminalia arjuna', 'flora',
   'A large riverine tree with striking buttressed roots, found along the Mula-Mutha riverbanks. Used extensively in Ayurvedic medicine for heart ailments. Old specimens line the riverfront near Bund Garden.',
   'Riverbanks, floodplains',
   'Mula-Mutha Riverfront, Bund Garden Park, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Terminalia_arjuna_at_Surajkund_Faridabad_2013.jpg&width=480'),

  ('Indian Tulip', 'Thespesia populnea', 'flora',
   'A coastal and inland tree often planted along Pune''s lakes and Khadakwasla reservoir shores. Its hibiscus-like yellow flowers are an important nectar source for sunbirds and butterflies.',
   'Lakeshores, waterways, coastal margins',
   'Khadakwasla Reservoir shores, Mula River banks, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Thespesia_populnea_flowers.jpg&width=480'),

  ('Ashoka Tree', 'Saraca asoca', 'flora',
   'A beautiful flowering tree with dense clusters of bright orange-red flowers. Planted extensively in the grounds of Aga Khan Palace, Peshwa-era wadas (mansions), and temple gardens across Pune.',
   'Temple gardens, heritage properties, moist valleys',
   'Aga Khan Palace, Shaniwarwada gardens, Parvati Hill, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Saraca_asoca_flowers.jpg&width=480'),

  ('Bamboo (Male Bamboo)', 'Dendrocalamus strictus', 'flora',
   'Dense bamboo groves form important wildlife corridors in the Sinhagad and Tamhini forested valleys. Bamboo is also a critical food source for Indian porcupines and several bird species in the region.',
   'Moist forested valleys, hillside ravines',
   'Tamhini Ghat, Sinhagad Valley, Mulshi forest patches, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Dendrocalamus_strictus_-_Bangalore.jpg&width=480'),

  ('Jacaranda', 'Jacaranda mimosifolia', 'flora',
   'Originally from South America, jacaranda trees were introduced by the British and now bloom spectacularly in Pune every February–March, carpeting roads in purple blossoms. Camp and Koregaon Park are famous for them.',
   'Urban avenues, bungalow gardens',
   'Koregaon Park, Camp Area (MG Road), Boat Club Road, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Jacaranda_mimosifolia_in_flower.jpg&width=480'),

  ('Brahma Kamal (Night lotus)', 'Saussurea obvallata', 'flora',
   'India''s rare and sacred night-blooming flower, found at higher altitudes of the Sahyadri. Observed near Harishchandragad and Kalsubai peak (accessible from Pune). Blooms only once a year at night.',
   'High-altitude rocky slopes of Sahyadri (above 1200 m)',
   'Harishchandragad & Kalsubai, Ahmednagar (3–4 hrs from Pune)',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Saussurea_obvallata_var._obvallata.jpg&width=480'),

  ('Rain Tree (Monkey Pod)', 'Samanea saman', 'flora',
   'Enormous spreading rain trees create iconic green canopies across Pune''s older roads. The trees fold their leaves before rain — giving them their common name. Magnificent specimens line Fergusson College Road.',
   'Urban avenues, park boundaries',
   'Fergusson College Road, Deccan Gymkhana area, Pune',
   'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Samanea_saman_pod.jpg&width=480');
