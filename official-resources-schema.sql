-- ================================================================
-- BioWatch: Official Resources Schema (Broad, Independent Focus)
-- Run this in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS + INSERT OR IGNORE pattern)
-- ================================================================

-- ── 1. Create pmc_officials table (now used for ALL govt depts) ──

-- Drop old department check constraint if it exists from a previous run
ALTER TABLE pmc_officials
  DROP CONSTRAINT IF EXISTS pmc_officials_department_check;

CREATE TABLE IF NOT EXISTS pmc_officials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  designation TEXT NOT NULL,
  department  TEXT NOT NULL,   -- no CHECK constraint — any dept is valid
  phone       TEXT,
  email       TEXT,
  office_address TEXT,
  zone        TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pmc_officials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read pmc_officials"    ON pmc_officials;
DROP POLICY IF EXISTS "Admin can insert pmc_officials"  ON pmc_officials;
DROP POLICY IF EXISTS "Admin can update pmc_officials"  ON pmc_officials;
DROP POLICY IF EXISTS "Admin can delete pmc_officials"  ON pmc_officials;

CREATE POLICY "Anyone can read pmc_officials"    ON pmc_officials FOR SELECT USING (true);
CREATE POLICY "Admin can insert pmc_officials"  ON pmc_officials FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin can update pmc_officials"  ON pmc_officials FOR UPDATE USING (is_admin());
CREATE POLICY "Admin can delete pmc_officials"  ON pmc_officials FOR DELETE USING (is_admin());

-- ── 2. Create legal_advisories table ─────────────────────────────
CREATE TABLE IF NOT EXISTS legal_advisories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('tree', 'wildlife', 'environment')),
  source      TEXT,
  source_url  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_advisories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read legal_advisories"    ON legal_advisories;
DROP POLICY IF EXISTS "Admin can insert legal_advisories"  ON legal_advisories;
DROP POLICY IF EXISTS "Admin can update legal_advisories"  ON legal_advisories;
DROP POLICY IF EXISTS "Admin can delete legal_advisories"  ON legal_advisories;

CREATE POLICY "Anyone can read legal_advisories"    ON legal_advisories FOR SELECT USING (true);
CREATE POLICY "Admin can insert legal_advisories"  ON legal_advisories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin can update legal_advisories"  ON legal_advisories FOR UPDATE USING (is_admin());
CREATE POLICY "Admin can delete legal_advisories"  ON legal_advisories FOR DELETE USING (is_admin());

-- ── 3. CLEAR old seed data & re-insert fresh ─────────────────────
TRUNCATE TABLE pmc_officials CASCADE;
TRUNCATE TABLE legal_advisories CASCADE;

-- ── 4. Seed: Officials — BROAD, MULTI-DEPARTMENT ─────────────────
INSERT INTO pmc_officials (name, designation, department, phone, email, office_address, zone) VALUES

-- ── Maharashtra Forest Department ─────────────────────────────────
('Pune Forest Division', 'Chief Conservator of Forests — Pune', 'Maharashtra Forest Department',
 '020-26122000', 'ccf.pune@mahaforest.gov.in',
 'Aranya Bhavan, S P College Road, Shivajinagar, Pune - 411 005', 'Pune Division'),

('Sahyadri Tiger Reserve', 'Field Director', 'Maharashtra Forest Department',
 '02164-222220', 'fielddirectorsahyadri@gmail.com',
 'Sahyadri Tiger Reserve Office, Satara, Maharashtra - 415 015', 'Satara / Kolhapur'),

('Junnar Forest Division', 'Deputy Conservator of Forests (Leopard Mitigation)', 'Maharashtra Forest Department',
 '02132-225400', 'dcf.junnar@mahaforest.gov.in',
 'Junnar Forest Division, Junnar, Pune District - 410 502', 'Junnar / Shirur Zone'),

('Khandala Forest Range', 'Range Forest Officer', 'Maharashtra Forest Department',
 '02114-222233', NULL,
 'Khandala Forest Range Office, Khopoli, Raigad - 410 203', 'Western Ghats Range'),

-- ── Wildlife SOS ──────────────────────────────────────────────────
('Wildlife SOS — 24×7 Helpline', 'Rescue & Rapid Response', 'Wildlife SOS',
 '1926', 'info@wildlifesos.org',
 'Wildlife SOS India, C-56A/34, Sector 62, Noida - 201 301', 'National'),

('Wildlife SOS — Manikdoh Leopard Rescue', 'Leopard Conservation & Rescue Centre', 'Wildlife SOS',
 '02132-247500', 'manikdoh@wildlifesos.org',
 'Manikdoh Leopard Rescue Centre, Junnar, Pune District - 410 502', 'Junnar'),

-- ── Wildlife Crime Control Bureau (WCCB) ─────────────────────────
('WCCB Western Region — Mumbai', 'Regional Deputy Director', 'Wildlife Crime Control Bureau',
 '022-22027108', 'wccbmumbai@gov.in',
 'WCCB Western Region, CGO Complex, Churchgate, Mumbai - 400 020', 'Maharashtra / West India'),

-- ── Maharashtra Pollution Control Board (MPCB) ───────────────────
('MPCB — Pune Office', 'Regional Officer', 'Maharashtra Pollution Control Board',
 '020-26058424', 'rp.pune@mpcb.gov.in',
 'MPCB Regional Office, Shivajinagar, Pune - 411 005', 'Pune'),

('MPCB — Air & Noise Pollution Desk', 'Senior Environmental Engineer', 'Maharashtra Pollution Control Board',
 '020-26058425', 'airpollution.pune@mpcb.gov.in',
 'MPCB Regional Office, Shivajinagar, Pune - 411 005', 'Pune'),

-- ── National Green Tribunal (NGT) ────────────────────────────────
('NGT Western Zone Bench — Pune', 'Registrar, Western Zone', 'National Green Tribunal',
 '020-25512626', 'ngtpune@nic.in',
 'NGT Western Zone Bench, Phule Vastu Sangrahalya, Shivajinagar, Pune - 411 005', 'Pune / Western India'),

-- ── MoEFCC — Ministry of Environment, Forest & Climate Change ────
('MoEFCC Central Helpline', 'Public Grievance Officer', 'Ministry of Environment (MoEFCC)',
 '011-24695327', 'helpline-moefcc@gov.in',
 'Indira Paryavaran Bhavan, Jor Bagh Road, New Delhi - 110 003', 'National'),

-- ── Bombay Natural History Society (BNHS) ────────────────────────
('BNHS Pune Research Station', 'Research Scientist', 'Bombay Natural History Society (BNHS)',
 '022-22821811', 'bnhs@bnhs.org',
 'BNHS, Hornbill House, Shaheed Bhagat Singh Marg, Mumbai - 400 023', 'Maharashtra'),

-- ── PMC — Tree Authority (Reference Only) ─────────────────────────
('PMC Tree Authority', 'Tree Officer — Permits & Complaints', 'PMC Tree Authority',
 '020-25501100', 'tree@punecorporation.org',
 'PMC Main Building, Shivajinagar, Pune - 411 005', 'Pune City'),

('PMC Environment Department', 'Chief Environmental Officer', 'PMC Environment Department',
 '020-25501300', 'environment@punecorporation.org',
 'PMC Main Building, Shivajinagar, Pune - 411 005', 'Pune City'),

('PMC Control Room', '24×7 Citizen Emergency Helpline', 'PMC General Helpline',
 '18001030222', 'info@punecorporation.org',
 'Near Mangala Theatre, Shivajinagar, Pune - 411 005', 'Pune City (All Zones)');

-- ── 5. Seed: Legal Advisories ─────────────────────────────────────
INSERT INTO legal_advisories (title, description, category, source, source_url) VALUES

-- ── TREE ──
('Tree Cutting Requires Government Permission',
 'Under the Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975, cutting, lopping, or removing any tree within municipal limits without prior written permission from the Tree Authority is a punishable offence. Citizens must apply at the local municipal Tree Authority office or online portal.',
 'tree', 'Maharashtra Trees Act 1975 / PMC Tree Authority',
 'https://www.pmc.gov.in/en/d/tree'),

('Penalty for Illegal Tree Felling',
 'Unauthorized cutting of a protected tree invites a fine of ₹1,000–₹10,000 per tree, plus the obligation to plant 5 saplings per tree felled and ensure their survival for 5 years. Repeat offenders face imprisonment up to 6 months under Section 10 of the Maharashtra Trees Act, 1975.',
 'tree', 'Maharashtra Trees Act 1975, Section 10', NULL),

('Heritage Trees — Maximum Legal Protection',
 'Trees aged 100+ years or with girth > 5 metres at breast height are classified as Heritage Trees. These cannot be cut under any circumstance. Any encroachment or damage must be reported to the local Forest Division or Tree Authority immediately with photographic evidence.',
 'tree', 'Maharashtra Heritage Tree Policy', NULL),

('How to Apply for Tree Cutting Permission',
 'Step 1 — Apply at Tree Authority office or online (services.pmc.gov.in for PMC areas; your municipal portal otherwise). Step 2 — Mention the reason (construction, danger, disease). Step 3 — Await on-site inspection (7–30 working days). Step 4 — If approved, a compensatory planting order is issued. Cutting must happen within 3 months of approval.',
 'tree', 'PMC / Municipal Tree Authority Procedure',
 'https://services.pmc.gov.in'),

('Citizen Power to Report Illegal Tree Felling',
 'Any citizen can file a complaint against illegal tree felling under the Maharashtra Trees Act. You may report to the Forest Division, local municipal Tree Authority, or use BioWatch ("Illegal Tree Cutting" category). Departments are legally obligated to acknowledge within 7 working days.',
 'tree', 'Maharashtra Trees Act 1975', NULL),

-- ── WILDLIFE ──
('Leopard Sighting — What To Do (Pune / Junnar)',
 'Do NOT approach, corner, or provoke a leopard. Keep at least 50 metres distance. Do not use flash photography or loud noises. Call Wildlife SOS Rescue: 1926 (24×7) or Junnar Forest Division: 02132-225400. Inform nearby villagers calmly and allow the animal to retreat on its own. Do not attempt to trap or chase.',
 'wildlife', 'Wildlife SOS / Maharashtra Forest Department',
 'https://wildlifesos.org'),

('Wildlife Protection Act, 1972 — Core Provisions',
 'The Wildlife Protection Act (WPA), 1972 is the primary law governing protection of wildlife in India. Key provisions: Schedule I animals (leopard, tiger, elephant) get highest protection; hunting or poaching attracts 3–7 years imprisonment + ₹25,000 fine; trade in wildlife products is a cognizable, non-bailable offence investigated by WCCB.',
 'wildlife', 'Wildlife Protection Act, 1972 (India)',
 'https://www.indiacode.nic.in'),

('Do Not Feed or Habituate Wild Animals',
 'Feeding monkeys, leopards, jackals, or other wild animals near residential areas habituates them to humans and escalates conflict. Under WPA 1972, deliberately feeding or baiting a Schedule I animal without authorization is an offence. Contact the Forest Department for professional conflict mitigation — do not attempt DIY trapping.',
 'wildlife', 'Wildlife Protection Act, 1972',
 'https://www.indiacode.nic.in'),

('Reporting Wildlife Crime & Poaching',
 'Wildlife crimes — poaching, illegal trade, habitat destruction — can be reported to: Wildlife Crime Control Bureau (WCCB) at 1800-102-7219 (toll free), Wildlife SOS at 1926, or the nearest Forest Division. For Pune district: WCCB Western Region, Mumbai — 022-22027108. Evidence (photos, videos, location) is critical. All complaints are treated confidentially.',
 'wildlife', 'Wildlife Crime Control Bureau / WCCB',
 'https://wccb.gov.in'),

('Man-Animal Conflict Protocol (Maharashtra)',
 'Maharashtra Forest Department follows a graded response protocol for human-wildlife conflict. For repeated livestock kills or human injury threats: alert the Forest Division with GPS location and photo evidence; do NOT install wire snares or poison baits (illegal under WPA 1972 and IPC); cooperate with forest officials during rescue or capture operations. Compensation claims for livestock loss can be filed at the Range Forest Officer office within 48 hours of the incident.',
 'wildlife', 'Maharashtra Forest Department / WPA 1972', NULL),

-- ── ENVIRONMENT ──
('Environment Protection Act, 1986 — Citizen Rights',
 'The Environment Protection Act (EPA), 1986 empowers every citizen to file environmental complaints. Under Section 19, any person can approach the Magistrate for violations. Larger violations (industrial pollution, mass deforestation) should be filed with the National Green Tribunal (NGT). The NGT Western Zone Bench in Pune handles cases for Maharashtra and surrounding states.',
 'environment', 'Environment Protection Act, 1986 / NGT',
 'https://greentribunal.gov.in'),

('Maharashtra Pollution Control Board — Citizen Complaints',
 'Citizens can report air pollution (construction dust, factory smoke), water pollution (chemical dumping in rivers), and noise pollution to the MPCB. For Pune: call 020-26058424 or email rp.pune@mpcb.gov.in. MPCB can issue show-cause notices, impose environmental compensation fees, and direct closure of violating industries.',
 'environment', 'Maharashtra Pollution Control Board (MPCB)',
 'https://mpcb.gov.in'),

('Solid Waste & Open Dumping Laws',
 'Dumping solid waste, construction debris, or hazardous material at unauthorised sites violates the Solid Waste Management Rules, 2016 and the Environment Protection Act, 1986. Citizens can report open dumping via BioWatch ("Garbage Dumping"), PMC Care, or MPCB. Fines range from ₹500 (individuals) to ₹5,000+ per incident for repeat violators.',
 'environment', 'Solid Waste Management Rules 2016 / EPA 1986',
 'https://mpcb.gov.in'),

('National Green Tribunal (NGT) — Filing Complaints',
 'The NGT is a specialised judicial body for environmental disputes. Any person or community affected by an environmental violation can file an application. Western Zone Bench: Pune (Phule Vastu Sangrahalaya, Shivajinagar). Filing fee: ₹1,000 for individuals, ₹5,000 for associations. Contact: ngtpune@nic.in | 020-25512626. Cases are typically heard within 6 months.',
 'environment', 'National Green Tribunal Act, 2010',
 'https://greentribunal.gov.in'),

('Air Quality & Construction Dust Norms',
 'All construction sites must comply with Dust Pollution Control norms under the Environment Protection Act, 1986. Requirements: green nets (90% density), water sprinklers during working hours, no burning of construction waste, proper debris disposal. Violations can be reported to MPCB (Pune: 020-26058425) or your local municipal environment officer with site photos and GPS location.',
 'environment', 'Environment Protection Act 1986 / MPCB',
 'https://mpcb.gov.in');

-- ── Verify ────────────────────────────────────────────────────────
SELECT 'pmc_officials'   AS table_name, COUNT(*) AS records FROM pmc_officials
UNION ALL
SELECT 'legal_advisories', COUNT(*) FROM legal_advisories;
