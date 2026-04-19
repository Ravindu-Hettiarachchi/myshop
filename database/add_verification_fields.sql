-- Add verification fields directly to the shops table
ALTER TABLE shops 
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    ADD COLUMN IF NOT EXISTS business_registration_no TEXT,
    ADD COLUMN IF NOT EXISTS business_images TEXT[],
    ADD COLUMN IF NOT EXISTS nic_files TEXT[];

-- Migrate existing approved shops to verified, and unapproved shops to unverified
UPDATE shops SET verification_status = 'verified' WHERE is_approved = true;
UPDATE shops SET verification_status = 'unverified' WHERE is_approved = false;

-- To prevent unauthorized updates to these sensitive fields by shop owners directly via API
-- we should ideally have RLS policies, but we can assume backend APIs using service role handle it.
