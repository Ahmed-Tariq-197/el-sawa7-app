-- Fix views RLS - they need proper policies
-- Views with security_invoker inherit calling user's permissions

-- For profiles_public view, allow authenticated users to select
DROP VIEW IF EXISTS public.profiles_public CASCADE;

-- Create a security definer function for safe profile access
CREATE OR REPLACE FUNCTION public.get_passenger_name(passenger_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name FROM public.profiles WHERE id = passenger_id
$$;

-- Remove view and just use the function for safe access

-- For reservations queue, drop the view and use limited access
DROP VIEW IF EXISTS public.reservations_queue CASCADE;

-- Create function to get queue info without sensitive data
CREATE OR REPLACE FUNCTION public.get_trip_queue(trip_uuid uuid)
RETURNS TABLE (
  passenger_name text,
  queue_position integer,
  seats_count integer,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.name,
    r.queue_position,
    r.seats_count,
    r.status
  FROM public.reservations r
  JOIN public.profiles p ON r.user_id = p.id
  WHERE r.trip_id = trip_uuid
  ORDER BY r.queue_position
$$;

-- Fix driver access to reservations - create limited view function
DROP POLICY IF EXISTS "Drivers can view trip reservations" ON public.reservations;
DROP POLICY IF EXISTS "Drivers can view reservations for their trips" ON public.reservations;

-- Create driver-specific function that excludes payment details
CREATE OR REPLACE FUNCTION public.get_driver_trip_passengers(trip_uuid uuid)
RETURNS TABLE (
  reservation_id uuid,
  passenger_name text,
  passenger_phone text,
  queue_position integer,
  seats_count integer,
  status text,
  payment_status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return if the caller is the driver of this trip
  IF EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = trip_uuid 
    AND driver_id = auth.uid()
  ) THEN
    RETURN QUERY
    SELECT 
      r.id,
      p.name,
      p.phone,
      r.queue_position,
      r.seats_count,
      r.status,
      r.payment_status
    FROM public.reservations r
    JOIN public.profiles p ON r.user_id = p.id
    WHERE r.trip_id = trip_uuid
    ORDER BY r.queue_position;
  END IF;
END
$$;

-- Remove driver access to raw profiles - they should use the function instead
DROP POLICY IF EXISTS "Drivers can view passenger names in their trips" ON public.profiles;