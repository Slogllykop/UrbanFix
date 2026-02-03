-- Migration: 004_create_storage
-- Description: Configures storage buckets for issue images

-- Create storage bucket for issue images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-images',
  'issue-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'issue-images' AND
    auth.uid() IS NOT NULL
  );

-- Public read access for all images
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-images');

-- Users can delete their own uploaded images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'issue-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
