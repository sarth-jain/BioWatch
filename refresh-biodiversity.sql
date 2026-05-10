-- ============================================================
-- BIODIVERSITY DATA — Pune Ecosystem (Simplified)
-- Run this in Supabase SQL Editor
-- 5 Fauna + 5 Flora = 10 species
-- ============================================================

-- Add location column if it doesn't exist yet
ALTER TABLE biodiversity ADD COLUMN IF NOT EXISTS location TEXT;

DELETE FROM biodiversity WHERE true;

INSERT INTO biodiversity (name, scientific_name, type, description, habitat, location, image_url) VALUES

-- ══════════════════════════════════════════════
-- ── FAUNA (5 species) ──
-- ══════════════════════════════════════════════

  ('Indian Leopard', 'Panthera pardus fusca', 'fauna',
   'A large spotted cat native to the Indian subcontinent. Sightings are regularly reported near Sinhagad and Bhimashankar. They navigate forest corridors between the Western Ghats and the hills around Pune.',
   'Deciduous forests, rocky scrublands, forested hills',
   'Sinhagad Fort area & Bhimashankar Wildlife Sanctuary, Pune',
   'https://cdn.pixabay.com/photo/2017/10/25/16/54/leopard-2888519_640.jpg'),

  ('Indian Peafowl', 'Pavo cristatus', 'fauna',
   'The national bird of India. Peacocks are a common and beloved sight at Rajiv Gandhi Zoological Park and across agricultural land on the outskirts of Pune. Males display spectacular plumage during the monsoon breeding season.',
   'Open forests, grasslands, farmland edges',
   'Rajiv Gandhi Zoological Park (Katraj), Pashan Lake, Pune',
   'https://cdn.pixabay.com/photo/2017/06/02/18/24/peacock-2367183_640.jpg'),

  ('Indian Giant Squirrel', 'Ratufa indica', 'fauna',
   'A striking multi-coloured tree squirrel endemic to India. Found in the dense canopy forests of Bhimashankar, a wildlife sanctuary roughly 110 km from Pune. Listed as Vulnerable by IUCN.',
   'Moist deciduous and semi-evergreen forests',
   'Bhimashankar Wildlife Sanctuary (110 km from Pune)',
   'https://cdn.pixabay.com/photo/2017/01/31/17/29/animal-2025286_640.jpg'),

  ('Spotted Deer (Chital)', 'Axis axis', 'fauna',
   'The most common deer species in India. Herds graze in the grasslands and forest edges near Bhimashankar and are seen at Rajiv Gandhi Zoo in Katraj. Their alarm calls warn other animals of predators.',
   'Grasslands, forest edges, open woodlands',
   'Rajiv Gandhi Zoological Park (Katraj), Bhimashankar, Pune',
   'https://cdn.pixabay.com/photo/2019/11/17/18/28/deer-4633552_640.jpg'),

  ('Indian Grey Hornbill', 'Ocyceros birostris', 'fauna',
   'A medium-sized hornbill commonly heard calling in Pune city — one of the few hornbill species that has adapted to urban environments. Nests in large trees with natural hollows.',
   'Urban tree canopies, deciduous forests, gardens',
   'Pune University campus, Law College Road, Koregaon Park, Pune',
   'https://cdn.pixabay.com/photo/2020/02/17/12/32/hornbill-4856414_640.jpg'),


-- ══════════════════════════════════════════════
-- ── FLORA (5 species) ──
-- ══════════════════════════════════════════════

  ('Banyan Tree', 'Ficus benghalensis', 'flora',
   'India''s national tree. Massive specimen banyan trees line the avenues of Empress Garden and are found throughout Pune''s heritage precincts. Their aerial roots form new trunks, creating micro-ecosystems.',
   'Tropical forests, heritage gardens, roadside avenues',
   'Empress Garden, Deccan Gymkhana, Aga Khan Palace, Pune',
   'https://cdn.pixabay.com/photo/2015/06/01/00/20/banyan-tree-792115_640.jpg'),

  ('Neem Tree', 'Azadirachta indica', 'flora',
   'A fast-growing tree prized for its medicinal and insecticidal properties. Widely planted along Pune''s roads and in residential areas. Almost every neighbourhood has neem trees providing dense summer shade.',
   'Tropical dry forests, urban streets, backyards',
   'Throughout Pune city — Shivajinagar, Kothrud, Aundh, Hadapsar',
   'https://cdn.pixabay.com/photo/2018/05/29/17/09/neem-3439254_640.jpg'),

  ('Gulmohar', 'Delonix regia', 'flora',
   'The Flame Tree explodes in scarlet-orange blossoms each summer (April–June), transforming Pune''s avenues into fiery corridors. Senapati Bapat Road and University Road are especially famous for their gulmohar canopy.',
   'Tropical urban boulevards, parks',
   'Senapati Bapat Road, Pune University Campus, Deccan, Pune',
   'https://cdn.pixabay.com/photo/2016/07/22/16/29/gulmohar-1535076_640.jpg'),

  ('Peepal Tree', 'Ficus religiosa', 'flora',
   'The sacred fig tree, revered in Hindu, Buddhist, and Jain traditions. Ancient specimens stand at Parvati Temple, near Kasba Ganpati, and across the Peth areas of old Pune.',
   'Temple precincts, roadsides, riverbanks',
   'Parvati Hill, Kasba Peth, Shaniwarwada surroundings, Pune',
   'https://cdn.pixabay.com/photo/2014/11/24/19/08/peepal-544542_640.jpg'),

  ('Jacaranda', 'Jacaranda mimosifolia', 'flora',
   'Originally from South America, jacaranda trees bloom spectacularly in Pune every February–March, carpeting roads in purple blossoms. Camp and Koregaon Park are famous for them.',
   'Urban avenues, bungalow gardens',
   'Koregaon Park, Camp Area (MG Road), Boat Club Road, Pune',
   'https://cdn.pixabay.com/photo/2016/10/31/02/00/jacaranda-1784559_640.jpg');
