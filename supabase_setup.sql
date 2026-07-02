-- ==========================================
-- OBELII SUPABASE SCHEMAS & RLS POLICIES
-- ==========================================
-- This file contains the complete SQL to set up your Supabase database.
-- Simply copy and paste this into the Supabase SQL Editor.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------
-- 1. WAITLIST TABLE
--------------------------------------------
-- Stores general and VIP registrations for the waitlist.
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Turn on Row Level Security (RLS) for the waitlist table
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated insertions (so anyone can join the waitlist)
CREATE POLICY "Allow anyone to join the waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

-- Allow everyone to view the waitlist entries (so position count and queue logs render correctly)
CREATE POLICY "Allow anyone to view the waitlist" 
ON public.waitlist 
FOR SELECT 
USING (true);

-- Allow delete waitlist entries (used by admin to clear waitlist)
CREATE POLICY "Allow anyone to delete waitlist"
ON public.waitlist
FOR DELETE
USING (true);


--------------------------------------------
-- 2. MEMBER PROFILES TABLE
--------------------------------------------
-- Stores premium member metadata linked to Supabase Auth users.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    tier TEXT DEFAULT 'FOUNDING MEMBER' NOT NULL,
    points INTEGER DEFAULT 100 NOT NULL,
    region_preference TEXT DEFAULT 'European Union' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Turn on Row Level Security (RLS) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can select their own profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile (e.g. region preference)
CREATE POLICY "Users can update their own profiles" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert their own profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profiles" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);


--------------------------------------------
-- 3. WISHLIST ITEMS TABLE
--------------------------------------------
-- Tracks curated items saved to wishlist by logged-in users.
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, product_id)
);

-- Turn on Row Level Security (RLS) for wishlist
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own wishlist items
CREATE POLICY "Users can select their own wishlist" 
ON public.wishlist_items 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own wishlist items
CREATE POLICY "Users can insert their own wishlist" 
ON public.wishlist_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own wishlist items
CREATE POLICY "Users can delete their own wishlist" 
ON public.wishlist_items 
FOR DELETE 
USING (auth.uid() = user_id);


--------------------------------------------
-- 4. PREORDERS TABLE
--------------------------------------------
-- Tracks priority boutique pre-order reservations.
CREATE TABLE IF NOT EXISTS public.preorders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, product_id)
);

-- Turn on Row Level Security (RLS) for preorders
ALTER TABLE public.preorders ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own preorders
CREATE POLICY "Users can select their own preorders" 
ON public.preorders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own preorders
CREATE POLICY "Users can insert their own preorders" 
ON public.preorders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own preorders
CREATE POLICY "Users can delete their own preorders" 
ON public.preorders 
FOR DELETE 
USING (auth.uid() = user_id);


--------------------------------------------
-- 5. PERFORMANCE INDEXES
--------------------------------------------
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON public.waitlist(position DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_preorders_user ON public.preorders(user_id);
