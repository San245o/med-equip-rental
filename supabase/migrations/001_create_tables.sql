-- Medical Equipment Rental Platform Database Schema
-- Enable PostGIS for geolocation features
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'both')) DEFAULT 'both',
  full_name TEXT NOT NULL,
  hospital_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Equipment Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, icon, description) VALUES
  ('Imaging Equipment', 'imaging', 'scan', 'X-ray machines, MRI, CT scanners, ultrasound'),
  ('Surgical Equipment', 'surgical', 'scissors', 'Operating tables, surgical lights, instruments'),
  ('Patient Monitoring', 'monitoring', 'activity', 'Vital signs monitors, ECG machines'),
  ('Laboratory Equipment', 'laboratory', 'flask-conical', 'Analyzers, centrifuges, microscopes'),
  ('Respiratory Equipment', 'respiratory', 'wind', 'Ventilators, oxygen concentrators, CPAP'),
  ('Rehabilitation', 'rehabilitation', 'accessibility', 'Physical therapy equipment, wheelchairs'),
  ('Diagnostic Equipment', 'diagnostic', 'stethoscope', 'Diagnostic tools and devices'),
  ('Emergency Equipment', 'emergency', 'siren', 'Defibrillators, emergency carts, stretchers');

-- 3. Equipment Catalog (owned by sellers)
CREATE TABLE equipment (
  id BIGSERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  model TEXT,
  year_manufactured INTEGER,
  condition TEXT CHECK (condition IN ('new', 'excellent', 'good', 'fair')) DEFAULT 'good',
  daily_rate DECIMAL(10,2) NOT NULL,
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  available BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Rentals (bookings)
CREATE TABLE rentals (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'rejected')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reviews
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  rental_id BIGINT NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Messages (in-app communication)
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  rental_id BIGINT REFERENCES rentals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_equipment_seller ON equipment(seller_id);
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_available ON equipment(available);
CREATE INDEX idx_equipment_location ON equipment(latitude, longitude);
CREATE INDEX idx_rentals_buyer ON rentals(buyer_id);
CREATE INDEX idx_rentals_seller ON rentals(seller_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, read);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Equipment: Everyone can view, sellers can manage their own
CREATE POLICY "Equipment is viewable by everyone" ON equipment
  FOR SELECT USING (true);

CREATE POLICY "Sellers can insert equipment" ON equipment
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own equipment" ON equipment
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own equipment" ON equipment
  FOR DELETE USING (auth.uid() = seller_id);

-- Rentals: Buyers and sellers can view their own rentals
CREATE POLICY "Users can view own rentals" ON rentals
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create rentals" ON rentals
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update rentals" ON rentals
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Reviews: Everyone can read, participants can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Rental participants can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM rentals 
      WHERE rentals.id = rental_id 
      AND (rentals.buyer_id = auth.uid() OR rentals.seller_id = auth.uid())
      AND rentals.status = 'completed'
    )
  );

-- Messages: Only sender and receiver can view
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update message read status" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'both')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rentals_updated_at
  BEFORE UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to get nearby equipment
CREATE OR REPLACE FUNCTION get_nearby_equipment(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  daily_rate DECIMAL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.daily_rate,
    e.latitude,
    e.longitude,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(e.latitude)) *
        cos(radians(e.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(e.latitude))
      )
    ) AS distance_km
  FROM equipment e
  WHERE e.available = true
    AND e.latitude IS NOT NULL
    AND e.longitude IS NOT NULL
  HAVING (
    6371 * acos(
      cos(radians(user_lat)) * cos(radians(e.latitude)) *
      cos(radians(e.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(e.latitude))
    )
  ) <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
