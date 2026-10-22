-- ==============================================================================
-- CivicFix AI 2.0 - Storage Bucket & Policies
-- Supabase Storage for Complaint Photos
-- ==============================================================================

-- 1. Create a public storage bucket for complaint photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'complaint-images', 
    'complaint-images', 
    true, 
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[];

-- 2. Storage Policies

-- Allow public read access to uploaded complaint photos
CREATE POLICY "Public Read Access for Complaint Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'complaint-images');

-- Allow authenticated and guest users to upload complaint photos
CREATE POLICY "Allow Image Uploads to complaint-images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'complaint-images'
    );

-- Only Admins or image owners can delete an image
CREATE POLICY "Admins or owners can delete complaint images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'complaint-images' AND
        (auth.uid() = owner OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    );
