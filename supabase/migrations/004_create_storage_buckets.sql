-- Create storage buckets for equipment images and avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('equipment-images', 'equipment-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for equipment-images bucket
CREATE POLICY "Public read access for equipment images" ON storage.objects
  FOR SELECT USING (bucket_id = 'equipment-images');

CREATE POLICY "Authenticated users can upload equipment images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'equipment-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own equipment images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'equipment-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own equipment images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'equipment-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for avatars bucket  
CREATE POLICY "Public read access for avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
