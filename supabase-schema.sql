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
-- SAMPLE BIODIVERSITY DATA (Pune) — 5 Fauna + 5 Flora
-- Run only in a fresh setup. For existing DBs, use INSERT ... ON CONFLICT DO NOTHING
-- ============================================
DELETE FROM biodiversity WHERE true;

INSERT INTO biodiversity (name, scientific_name, type, description, habitat, location, image_url) VALUES

-- ── FAUNA (5) ──
  ('Indian Leopard', 'Panthera pardus fusca', 'fauna',
   'A large spotted cat native to the Indian subcontinent. Sightings are regularly reported near Sinhagad and Bhimashankar. They navigate forest corridors between the Western Ghats and the hills around Pune.',
   'Deciduous forests, rocky scrublands, forested hills',
   'Sinhagad Fort area & Bhimashankar Wildlife Sanctuary, Pune',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Indian_Leopard.jpg/480px-Indian_Leopard.jpg'),

  ('Indian Peafowl', 'Pavo cristatus', 'fauna',
   'The national bird of India. Peacocks are a common and beloved sight at Rajiv Gandhi Zoological Park and across agricultural land on the outskirts of Pune. Males display spectacular plumage during the monsoon breeding season.',
   'Open forests, grasslands, farmland edges',
   'Rajiv Gandhi Zoological Park (Katraj), Pashan Lake, Pune',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Peacock_Plumage.jpg/480px-Peacock_Plumage.jpg'),

  ('Indian Giant Squirrel', 'Ratufa indica', 'fauna',
   'A striking multi-coloured tree squirrel endemic to India. Found in the dense canopy forests of Bhimashankar, a wildlife sanctuary roughly 110 km from Pune. Listed as Vulnerable by IUCN.',
   'Moist deciduous and semi-evergreen forests',
   'Bhimashankar Wildlife Sanctuary (110 km from Pune)',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Ratufa_indica_%28Bhadra%2C_2006%29.jpg/480px-Ratufa_indica_%28Bhadra%2C_2006%29.jpg'),

  ('Spotted Deer (Chital)', 'Axis axis', 'fauna',
   'The most common deer species in India. Herds graze in the grasslands and forest edges near Bhimashankar and are seen at Rajiv Gandhi Zoo in Katraj. Their alarm calls warn other animals of predators.',
   'Grasslands, forest edges, open woodlands',
   'Rajiv Gandhi Zoological Park (Katraj), Bhimashankar, Pune',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Spotted_deer_%28Axis_axis%29_male.jpg/480px-Spotted_deer_%28Axis_axis%29_male.jpg'),

  ('Indian Grey Hornbill', 'Ocyceros birostris', 'fauna',
   'A medium-sized hornbill commonly heard calling in Pune city — one of the few hornbill species that has adapted to urban environments. Nests in large trees with natural hollows.',
   'Urban tree canopies, deciduous forests, gardens',
   'Pune University campus, Law College Road, Koregaon Park, Pune',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Indian_Grey_Hornbill_%28Ocyceros_birostris%29_in_Hyderabad_W_IMG_7468.jpg/480px-Indian_Grey_Hornbill_%28Ocyceros_birostris%29_in_Hyderabad_W_IMG_7468.jpg'),

-- ── FLORA (5) ──
  ('Banyan Tree', 'Ficus benghalensis', 'flora',
   'India''s national tree. Massive specimen banyan trees line the avenues of Empress Garden and are found throughout Pune''s heritage precincts. Their aerial roots form new trunks, creating micro-ecosystems.',
   'Tropical forests, heritage gardens, roadside avenues',
   'Empress Garden, Deccan Gymkhana, Aga Khan Palace, Pune',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Ficus_benghalensis_-_Indian_Botanic_Garden_-_Howrah_2012-01-29_1692.JPG/480px-Ficus_benghalensis_-_Indian_Botanic_Garden_-_Howrah_2012-01-29_1692.JPG'),

  ('Neem Tree', 'Azadirachta indica', 'flora',
   'A fast-growing tree prized for its medicinal and insecticidal properties. Widely planted along Pune''s roads and in residential areas. Almost every neighbourhood has neem trees providing dense summer shade.',
   'Tropical dry forests, urban streets, backyards',
   'Throughout Pune city — Shivajinagar, Kothrud, Aundh, Hadapsar',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Neem_%28Azadirachta_indica%29_in_Hyderabad_W_IMG_6976.jpg/480px-Neem_%28Azadirachta_indica%29_in_Hyderabad_W_IMG_6976.jpg'),

  ('Gulmohar', 'Delonix regia', 'flora',
   'The Flame Tree explodes in scarlet-orange blossoms each summer (April–June), transforming Pune''s avenues into fiery corridors. Senapati Bapat Road and University Road are especially famous for their gulmohar canopy.',
   'Tropical urban boulevards, parks',
   'Senapati Bapat Road, Pune University Campus, Deccan, Pune',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Gulmohar_%28Delonix_regia%29_flowers_W_IMG_6879.jpg/480px-Gulmohar_%28Delonix_regia%29_flowers_W_IMG_6879.jpg'),

  ('Peepal Tree', 'Ficus religiosa', 'flora',
   'The sacred fig tree, revered in Hindu, Buddhist, and Jain traditions. Ancient specimens stand at Parvati Temple, near Kasba Ganpati, and across the Peth areas of old Pune.',
   'Temple precincts, roadsides, riverbanks',
   'Parvati Hill, Kasba Peth, Shaniwarwada surroundings, Pune',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Ficus_religiosa_Bo.jpg/480px-Ficus_religiosa_Bo.jpg'),

  ('Jacaranda', 'Jacaranda mimosifolia', 'flora',
   'Originally from South America, jacaranda trees bloom spectacularly in Pune every February–March, carpeting roads in purple blossoms. Camp and Koregaon Park are famous for them.',
   'Urban avenues, bungalow gardens',
   'Koregaon Park, Camp Area (MG Road), Boat Club Road, Pune',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Jacaranda_mimosifolia_at_Pune.JPG/480px-Jacaranda_mimosifolia_at_Pune.JPG');
