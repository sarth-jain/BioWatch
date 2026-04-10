-- ================================================================
-- BioWatch: Severity & Media Escalation — Migration Script
-- Run this in Supabase SQL Editor for your EXISTING database
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS)
-- ================================================================

-- Add severity & escalation columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS severity_level TEXT DEFAULT 'Low'
  CHECK (severity_level IN ('Low', 'Medium', 'High', 'Critical'));

ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- Add media collaboration columns
ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_flag BOOLEAN DEFAULT FALSE;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_shared_at TIMESTAMPTZ;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_notes TEXT;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS public_visibility BOOLEAN DEFAULT FALSE;

-- Proof of Work columns (uploaded when closing a report)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_of_work_url TEXT;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_of_work_notes TEXT;

-- ================================================================
-- Update RLS: Public users can read escalated/high-severity reports
-- (The existing "Anyone can read reports" policy already covers this,
--  but this documents the intent clearly)
-- ================================================================
-- No additional RLS needed; existing public read policy covers all rows.
-- Admin-only writes are already protected by is_admin() policies.

-- ================================================================
-- Verify columns were added (optional check)
-- ================================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'reports'
  AND column_name IN (
    'severity_level', 'priority_score', 'is_escalated',
    'escalation_reason', 'media_flag', 'media_shared_at',
    'media_notes', 'public_visibility'
  )
ORDER BY column_name;
