-- ================================================================
-- BioWatch: Proof of Work & Report Tracking Migration
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ================================================================

-- ── 1. Add human-readable report number to reports table ─────────
-- Creates a sequence starting from 1001 for nicer IDs like BW-1001
CREATE SEQUENCE IF NOT EXISTS report_number_seq START 1001;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS report_number INTEGER DEFAULT nextval('report_number_seq');

-- Make existing rows get unique numbers if they don't have one
DO $$
BEGIN
  UPDATE reports
  SET report_number = nextval('report_number_seq')
  WHERE report_number IS NULL;
END $$;

-- Add unique constraint so no two reports share the same number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_report_number_key'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_report_number_key UNIQUE (report_number);
  END IF;
END $$;

-- ── 2. Ensure proof_of_work columns exist on reports (for admin PoW) ──
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_of_work_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_of_work_notes TEXT;

-- ── 3. Create proof_submissions table ───────────────────────────
-- Separate table so volunteers (no login) can submit proof
-- Multiple submissions per report are allowed
CREATE TABLE IF NOT EXISTS proof_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  submitted_by TEXT NOT NULL,          -- volunteer name / "Admin"
  role TEXT DEFAULT 'volunteer' CHECK (role IN ('admin', 'volunteer')),
  photo_url TEXT,                       -- uploaded to storage bucket
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. RLS on proof_submissions ──────────────────────────────────
ALTER TABLE proof_submissions ENABLE ROW LEVEL SECURITY;

-- Drop old policies first if they exist (safe re-run)
DROP POLICY IF EXISTS "Anyone can read proof_submissions" ON proof_submissions;
DROP POLICY IF EXISTS "Anyone can submit proof" ON proof_submissions;
DROP POLICY IF EXISTS "Admin can delete proof" ON proof_submissions;

-- Anyone can read proof (so reporters can see it on the public page)
CREATE POLICY "Anyone can read proof_submissions" ON proof_submissions
  FOR SELECT USING (true);

-- Anyone can insert proof (volunteers submit without login)
CREATE POLICY "Anyone can submit proof" ON proof_submissions
  FOR INSERT WITH CHECK (true);

-- Only admins can delete proof
CREATE POLICY "Admin can delete proof" ON proof_submissions
  FOR DELETE USING (is_admin());

-- ── 5. Storage: make report-images bucket fully public ───────────
-- Ensures the bucket exists and is public (URLs work without auth)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('report-images', 'report-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

-- ── 6. Storage RLS: allow public uploads & reads ─────────────────
-- Drop old policies first (safe re-run)
DROP POLICY IF EXISTS "Allow public uploads to report-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from report-images"  ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to report-images"  ON storage.objects;

-- Allow anyone (including unauthenticated volunteers) to upload files
CREATE POLICY "Allow public uploads to report-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'report-images');

-- Allow anyone to read / view uploaded files (proof photos)
CREATE POLICY "Allow public reads from report-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-images');

-- Allow anyone to update/overwrite their own uploads (optional)
CREATE POLICY "Allow public updates to report-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'report-images');

-- ── 7. Trigger: auto-close report when proof is submitted ────────
-- Uses SECURITY DEFINER so it bypasses RLS and can update reports
-- even when the caller is unauthenticated (volunteer).
CREATE OR REPLACE FUNCTION auto_close_report_on_proof()
RETURNS TRIGGER AS $$
BEGIN
  -- Only close if NOT already closed (don't downgrade a re-opened report)
  UPDATE reports
  SET status = 'Closed'
  WHERE id = NEW.report_id
    AND status <> 'Closed';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to proof_submissions
DROP TRIGGER IF EXISTS trg_auto_close_report ON proof_submissions;
CREATE TRIGGER trg_auto_close_report
  AFTER INSERT ON proof_submissions
  FOR EACH ROW EXECUTE FUNCTION auto_close_report_on_proof();

-- ── 8. Verify ────────────────────────────────────────────────────
SELECT 'reports.report_number'   AS item, column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'reports' AND column_name = 'report_number'

UNION ALL

SELECT 'proof_submissions table' AS item, table_name, 'table'
  FROM information_schema.tables
 WHERE table_name = 'proof_submissions'

UNION ALL

SELECT 'storage bucket public'   AS item,
       b.id,
       CASE WHEN b.public THEN 'public=true ✅' ELSE 'public=false ❌' END
  FROM storage.buckets b
 WHERE b.id = 'report-images';
