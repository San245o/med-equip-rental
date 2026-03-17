-- Marketplace buy/sell support
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS listing_type TEXT NOT NULL DEFAULT 'rent'
    CHECK (listing_type IN ('rent', 'sell', 'both')),
  ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);

CREATE TABLE IF NOT EXISTS purchase_requests (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  offered_amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer ON purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller ON purchase_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);

ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchase requests" ON purchase_requests
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create purchase requests" ON purchase_requests
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update purchase requests" ON purchase_requests
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TRIGGER update_purchase_requests_updated_at
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
