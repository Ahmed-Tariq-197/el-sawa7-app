-- Create a view for public profile data (without phone numbers)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  avatar_url,
  is_active,
  created_at
FROM public.profiles;

-- Fix: Create better policy - users can see own full profile, others only see name/avatar
-- First drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles of passengers in same trips" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate policies with proper restrictions
CREATE POLICY "Users can view own profile with all data"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drivers can view minimal profile info (name only via public view)
CREATE POLICY "Drivers can view passenger names in their trips"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    JOIN public.reservations r ON t.id = r.trip_id
    WHERE t.driver_id = auth.uid()
    AND r.user_id = profiles.id
  )
);

-- Fix reservations: Create view without sensitive payment data
CREATE OR REPLACE VIEW public.reservations_queue
WITH (security_invoker=on) AS
SELECT 
  id,
  trip_id,
  user_id,
  seats_count,
  queue_position,
  status,
  created_at
FROM public.reservations;

-- Drop and recreate reservations policy for trip participants
DROP POLICY IF EXISTS "Users can view queue positions in their trips only" ON public.reservations;

-- Users can only see full details of their own reservations
CREATE POLICY "Users can view own reservations fully"
ON public.reservations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Drivers see reservations in their trips (but users should use the view for queue)
CREATE POLICY "Drivers can view trip reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = reservations.trip_id
    AND trips.driver_id = auth.uid()
  )
);

-- Fix votes: Show only vote counts, not individual voter details
DROP POLICY IF EXISTS "Users can view votes" ON public.votes;

-- Users can only see their own votes
CREATE POLICY "Users can view own votes"
ON public.votes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can see all votes
CREATE POLICY "Admins can view all votes details"
ON public.votes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix cars: Allow admins to view inactive cars
DROP POLICY IF EXISTS "Anyone can view active cars" ON public.cars;

CREATE POLICY "Anyone can view active cars"
ON public.cars
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all cars"
ON public.cars
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix trips: Allow users to view trips they have reservations for
DROP POLICY IF EXISTS "Anyone can view scheduled trips" ON public.trips;

CREATE POLICY "Anyone can view scheduled trips"
ON public.trips
FOR SELECT
USING (status = ANY (ARRAY['scheduled'::text, 'in_progress'::text]));

CREATE POLICY "Users can view trips they have reservations for"
ON public.trips
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reservations
    WHERE reservations.trip_id = trips.id
    AND reservations.user_id = auth.uid()
  )
);

-- Create function to get vote counts (without exposing individual voters)
CREATE OR REPLACE FUNCTION public.get_trip_vote_count(trip_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.votes WHERE trip_id = trip_uuid
$$;