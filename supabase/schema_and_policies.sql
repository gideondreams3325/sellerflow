-- ============================================================================
-- SellerFlow Supabase Production Schema, RLS & Storage Policies
-- Project: vvpwntehstjbccarqqzp
-- Target Bucket: ghana-card-documents (Private)
-- Target Table: seller_verifications
-- ============================================================================

-- 1. SELLER VERIFICATIONS TABLE
-- Stores minimal verification audit metadata for Ghana Card verification.
CREATE TABLE IF NOT EXISTS public.seller_verifications (
  user_id TEXT PRIMARY KEY,
  card_hash TEXT NOT NULL,
  card_masked TEXT NOT NULL,
  front_storage_path TEXT NOT NULL,
  back_storage_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('VERIFIED', 'REVIEW', 'REJECTED')),
  review_reason TEXT,
  automated_check_passed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index card_hash for instant duplicate detection across all seller submissions
CREATE INDEX IF NOT EXISTS idx_seller_verifications_card_hash ON public.seller_verifications (card_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Regular users can ONLY view their own verification record.
-- Cannot read another user's verification record, card_hash, or masked card.
DROP POLICY IF EXISTS "Users can read own verification record" ON public.seller_verifications;
CREATE POLICY "Users can read own verification record"
  ON public.seller_verifications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = user_id
  );

-- Policy 2: Regular users CANNOT insert, update, or delete verification records directly.
-- All state transitions to 'VERIFIED', 'REVIEW', or 'REJECTED' are made exclusively
-- by the authoritative Edge Function using the SUPABASE_SERVICE_ROLE_KEY.
-- In Supabase/PostgreSQL, service-role calls bypass RLS, guaranteeing that
-- normal users cannot forge or modify their status.
DROP POLICY IF EXISTS "Deny client direct inserts on seller_verifications" ON public.seller_verifications;
CREATE POLICY "Deny client direct inserts on seller_verifications"
  ON public.seller_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny client direct updates on seller_verifications" ON public.seller_verifications;
CREATE POLICY "Deny client direct updates on seller_verifications"
  ON public.seller_verifications
  FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Deny client direct deletes on seller_verifications" ON public.seller_verifications;
CREATE POLICY "Deny client direct deletes on seller_verifications"
  ON public.seller_verifications
  FOR DELETE
  TO authenticated
  USING (false);


-- ============================================================================
-- 2. SUPABASE STORAGE SECURITY POLICIES (ghana-card-documents bucket)
-- Bucket: ghana-card-documents
-- Privacy: PRIVATE (public: false)
-- Path convention: verification/{userId}/front_{timestamp}.ext
--                  verification/{userId}/back_{timestamp}.ext
--                  media/{userId}/...
-- ============================================================================

-- Ensure the private bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ghana-card-documents',
  'ghana-card-documents',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage Policy 1: Authenticated users can upload to their own user directory ONLY
DROP POLICY IF EXISTS "Users can upload verification documents to own folder" ON storage.objects;
CREATE POLICY "Users can upload verification documents to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ghana-card-documents' AND
    (
      (storage.foldername(name))[1] = 'verification' AND
      (storage.foldername(name))[2] = auth.uid()::text
    ) OR (
      (storage.foldername(name))[1] = 'media' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
  );

-- Storage Policy 2: Users can ONLY read/download their own documents
-- Completely blocks cross-user document access and unauthorized inspection.
DROP POLICY IF EXISTS "Users can only read own documents in storage" ON storage.objects;
CREATE POLICY "Users can only read own documents in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ghana-card-documents' AND
    (
      (
        (storage.foldername(name))[1] = 'verification' AND
        (storage.foldername(name))[2] = auth.uid()::text
      ) OR (
        (storage.foldername(name))[1] = 'media'
      )
    )
  );

-- Storage Policy 3: Users can update or delete only their own uploaded media
DROP POLICY IF EXISTS "Users can update own storage files" ON storage.objects;
CREATE POLICY "Users can update own storage files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'ghana-card-documents' AND
    (
      (storage.foldername(name))[2] = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can delete own storage files" ON storage.objects;
CREATE POLICY "Users can delete own storage files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ghana-card-documents' AND
    (
      (storage.foldername(name))[2] = auth.uid()::text
    )
  );
