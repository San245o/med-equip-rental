ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS ipfs_image_cids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS listing_ipfs_cid TEXT,
  ADD COLUMN IF NOT EXISTS listing_ipfs_history TEXT[] DEFAULT '{}';
