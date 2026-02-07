-- Migration 001: Core Tables
-- Run this in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_members INTEGER NOT NULL,
  vehicle_capacity INTEGER DEFAULT 4,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team memberships
CREATE TABLE public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Cycles (rotation periods)
CREATE TABLE public.cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(team_id, cycle_number)
);

-- Dice rolls
CREATE TABLE public.dice_rolls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  die1 INTEGER NOT NULL CHECK (die1 >= 1 AND die1 <= 10),
  die2 INTEGER NOT NULL CHECK (die2 >= 1 AND die2 <= 10),
  total INTEGER GENERATED ALWAYS AS (die1 + die2) STORED,
  rolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cycle_id, user_id)
);

-- Meal turns (who chooses restaurant when)
CREATE TABLE public.meal_turns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  turn_order INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  restaurant_name TEXT,
  meal_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(cycle_id, week_number)
);

-- Vehicle assignments
CREATE TABLE public.vehicle_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_turn_id UUID REFERENCES public.meal_turns(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Teams policies
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins can create teams" ON public.teams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update teams" ON public.teams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Team members policies
CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Cycles policies
CREATE POLICY "Team members can view cycles" ON public.cycles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = cycles.team_id AND user_id = auth.uid()
  )
);
CREATE POLICY "System can manage cycles" ON public.cycles FOR ALL USING (true);

-- Dice rolls policies
CREATE POLICY "Team members can view dice rolls" ON public.dice_rolls FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cycles c
    JOIN public.team_members tm ON tm.team_id = c.team_id
    WHERE c.id = dice_rolls.cycle_id AND tm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create own dice rolls" ON public.dice_rolls FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Meal turns policies
CREATE POLICY "Team members can view meal turns" ON public.meal_turns FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cycles c
    JOIN public.team_members tm ON tm.team_id = c.team_id
    WHERE c.id = meal_turns.cycle_id AND tm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own meal turns" ON public.meal_turns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can manage meal turns" ON public.meal_turns FOR ALL USING (true);

-- Vehicle assignments policies
CREATE POLICY "Team members can view vehicle assignments" ON public.vehicle_assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.meal_turns mt
    JOIN public.cycles c ON c.id = mt.cycle_id
    JOIN public.team_members tm ON tm.team_id = c.team_id
    WHERE mt.id = vehicle_assignments.meal_turn_id AND tm.user_id = auth.uid()
  )
);
CREATE POLICY "System can manage vehicle assignments" ON public.vehicle_assignments FOR ALL USING (true);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Insert new profile, set as admin if first user
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, user_count = 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
