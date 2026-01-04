-- Storage bucket policies for MedRent
-- Run this in Supabase SQL Editor after creating buckets in the dashboard

-- Create storage buckets (run in dashboard or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('equipment-images', 'equipment-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Equipment Images Bucket Policies

-- Allow anyone to view equipment images
CREATE POLICY "Equipment images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-images');

-- Allow authenticated users to upload equipment images
CREATE POLICY "Authenticated users can upload equipment images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipment-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own equipment images
CREATE POLICY "Users can update own equipment images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'equipment-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own equipment images
CREATE POLICY "Users can delete own equipment images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipment-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatar Bucket Policies

-- Allow anyone to view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
