# MedRent - Medical Equipment Rental Marketplace

A modern platform for hospitals to rent medical equipment from each other. Built with Next.js 14, Supabase, and Leaflet maps.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## ✨ Features

- **🏥 Beautiful Landing Page** - Awwward-style design with Framer Motion animations
- **🔐 Authentication** - Supabase Auth with email/password
- **📊 Dashboard** - Dual-view for buyers and sellers
- **🗺️ Live Map** - Leaflet map showing active rentals and available equipment
- **📸 Image Upload** - Auto-compression before upload to Supabase Storage
- **💬 Real-time** - Supabase Realtime for live updates
- **📱 Responsive** - Fully mobile-friendly design

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd med-equip-rental
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration files in order:
   - `supabase/migrations/001_create_tables.sql` - Creates tables and RLS policies
   - `supabase/migrations/002_storage_policies.sql` - Sets up storage bucket policies

3. Create Storage Buckets:
   - Go to **Storage** in Supabase Dashboard
   - Create bucket: `equipment-images` (set as Public)
   - Create bucket: `avatars` (set as Public)

4. Get your API keys:
   - Go to **Settings > API**
   - Copy `Project URL` and `anon public` key

### 3. Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
med-equip-rental/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── login/page.tsx        # Login page
│   │   ├── signup/page.tsx       # Signup page
│   │   └── dashboard/
│   │       ├── page.tsx          # Server component
│   │       └── DashboardClient.tsx # Client dashboard
│   ├── components/
│   │   ├── EquipmentCard.tsx     # Equipment display card
│   │   ├── RentalCard.tsx        # Rental request card
│   │   ├── RentalMap.tsx         # Leaflet map component
│   │   ├── AddEquipmentModal.tsx # Add equipment form
│   │   └── RentalRequestModal.tsx # Request rental form
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser Supabase client
│   │   │   ├── server.ts         # Server Supabase client
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── upload.ts             # Image compression & upload
│   │   └── utils.ts              # Utility functions
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── middleware.ts             # Next.js middleware
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       └── 002_storage_policies.sql
└── public/
```

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `categories` | Equipment categories |
| `equipment` | Equipment listings |
| `rentals` | Rental bookings |
| `reviews` | User reviews |
| `messages` | In-app messaging |
| `notifications` | User notifications |

### Key Features

- **Row Level Security (RLS)** - Secure data access
- **Triggers** - Auto profile creation, updated_at timestamps
- **Indexes** - Optimized queries
- **PostGIS** - Geo-location queries for nearby equipment

## 🎨 Customization

### Colors

Edit `src/app/globals.css` to change the color scheme:

```css
:root {
  --primary: 166 84% 29%;    /* Teal */
  --accent: 166 84% 40%;     /* Bright teal */
  --background: 222 47% 3%;  /* Dark blue-black */
}
```

### Categories

Default equipment categories are seeded in the migration:
- Imaging (MRI, CT, X-Ray)
- Monitoring Equipment
- Surgical Equipment
- Lab Equipment
- Respiratory Equipment
- Patient Care

Add more via SQL:

```sql
INSERT INTO categories (name, slug, icon, description) 
VALUES ('New Category', 'new-category', 'icon-name', 'Description');
```

## 🚀 Deploy to Vercel

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### Deploy Steps

1. Push code to GitHub
2. Import repository to Vercel
3. Add environment variables
4. Deploy!

## 📱 App Pages

### Landing Page (`/`)
Beautiful Awwward-style landing with:
- Animated gradient orbs
- Stats counter
- Feature cards with hover effects
- Testimonials carousel
- CTA sections

### Login/Signup (`/login`, `/signup`)
- Clean authentication forms
- Role selection during signup
- Email/password authentication

### Dashboard (`/dashboard`)
- **Overview** - Stats and recent activity
- **Browse** - Search and filter equipment
- **My Equipment** - Manage listings (sellers)
- **My Rentals** - Track current rentals (buyers)
- **Requests** - Incoming rental requests (sellers)
- **Map View** - Live map of equipment/rentals
- **Messages** - In-app messaging
- **Settings** - Profile management

## 🛡️ Security

- **RLS Policies** - Database-level row security
- **Protected Routes** - Middleware auth checks
- **Input Validation** - Client and server-side
- **Secure File Upload** - Validated file types & size limits

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Maps**: React Leaflet, OpenStreetMap
- **Deployment**: Vercel (Serverless)

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

---

Built with ❤️ using Next.js, Supabase, and TailwindCSS
