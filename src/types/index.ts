// Types for Medical Equipment Rental Platform

export interface Profile {
  id: string;
  role: 'buyer' | 'seller' | 'both';
  full_name: string;
  hospital_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  avatar_url?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  created_at: string;
}

export interface Equipment {
  id: number;
  seller_id: string;
  category_id?: number;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  year_manufactured?: number;
  condition: 'new' | 'excellent' | 'good' | 'fair';
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  images: string[];
  specifications: Record<string, string>;
  latitude?: number;
  longitude?: number;
  city?: string;
  available: boolean;
  featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  seller?: Profile;
  category?: Category;
}

export interface Rental {
  id: number;
  equipment_id: number;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'rejected';
  start_date: string;
  end_date: string;
  total_amount: number;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  equipment?: Equipment;
  buyer?: Profile;
  seller?: Profile;
}

export interface Review {
  id: number;
  rental_id: number;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  // Joined fields
  reviewer?: Profile;
  reviewee?: Profile;
  rental?: Rental;
}

export interface Message {
  id: number;
  rental_id?: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  // Joined fields
  sender?: Profile;
  receiver?: Profile;
}

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// Form types
export interface EquipmentFormData {
  name: string;
  description: string;
  category_id: number;
  brand: string;
  model: string;
  year_manufactured: number;
  condition: Equipment['condition'];
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  city: string;
  latitude?: number;
  longitude?: number;
  specifications: Record<string, string>;
}

export interface RentalFormData {
  equipment_id: number;
  start_date: string;
  end_date: string;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  notes?: string;
}

// Map types
export interface MapMarker {
  id: number;
  type: 'equipment' | 'rental';
  latitude: number;
  longitude: number;
  title: string;
  status?: Rental['status'];
  category?: string;
  daily_rate?: number;
}

// Dashboard stats
export interface DashboardStats {
  totalEquipment: number;
  activeRentals: number;
  pendingRequests: number;
  totalRevenue: number;
  completedRentals: number;
}
