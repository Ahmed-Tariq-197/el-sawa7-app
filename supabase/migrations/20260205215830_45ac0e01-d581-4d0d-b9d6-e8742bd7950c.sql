-- =====================================================
-- ElSawa7 Finish Security Migration
-- Complete RLS policies, security definer functions
-- =====================================================

-- ===== 1. SECURITY DEFINER FUNCTIONS =====

-- log_action: Secure audit logging (immutable records)
CREATE OR REPLACE FUNCTION public.log_action(
  p_table_name TEXT,
  p_action TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.audit_logs (table_name, action, record_id, user_id, old_data, new_data, ip_address)
  VALUES (p_table_name, p_action, p_record_id, auth.uid(), p_old_data, p_new_data, NULL)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- admin_set_role: Secure role assignment (admin only)
CREATE OR REPLACE FUNCTION public.admin_set_role(
  p_user_id UUID,
  p_role app_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can set roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can set roles';
  END IF;
  
  -- Prevent self-demotion from admin
  IF auth.uid() = p_user_id AND p_role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote yourself from admin';
  END IF;
  
  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  PERFORM public.log_action('user_roles', 'role_assignment', p_user_id, NULL, jsonb_build_object('role', p_role));
  
  RETURN TRUE;
END;
$$;

-- driver_view_for_trip: Secure function for drivers to see passenger PHONE ONLY (not names)
CREATE OR REPLACE FUNCTION public.driver_view_for_trip(p_trip_id UUID)
RETURNS TABLE (
  reservation_id UUID,
  order_number INTEGER,
  phone TEXT,
  seats INTEGER,
  status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is the assigned driver for this trip
  IF NOT EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = p_trip_id 
    AND driver_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not assigned to this trip';
  END IF;
  
  RETURN QUERY
  SELECT 
    r.id AS reservation_id,
    r.queue_position AS order_number,
    p.phone,
    r.seats_count AS seats,
    r.status
  FROM public.reservations r
  JOIN public.profiles p ON r.user_id = p.id
  WHERE r.trip_id = p_trip_id
  AND r.status IN ('pending', 'confirmed')
  ORDER BY r.queue_position;
END;
$$;

-- passenger_queue_view: See names but NOT phone numbers
CREATE OR REPLACE FUNCTION public.passenger_queue_view(p_trip_id UUID)
RETURNS TABLE (
  reservation_id UUID,
  order_number INTEGER,
  passenger_name TEXT,
  avatar_url TEXT,
  seats INTEGER,
  status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has a reservation for this trip OR is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: No reservation for this trip';
  END IF;
  
  RETURN QUERY
  SELECT 
    r.id AS reservation_id,
    r.queue_position AS order_number,
    p.name AS passenger_name,
    p.avatar_url,
    r.seats_count AS seats,
    r.status
  FROM public.reservations r
  JOIN public.profiles p ON r.user_id = p.id
  WHERE r.trip_id = p_trip_id
  AND r.status IN ('pending', 'confirmed')
  ORDER BY r.queue_position;
END;
$$;

-- get_tracking_positions_secure: Secure access to driver positions
CREATE OR REPLACE FUNCTION public.get_tracking_positions_secure(
  p_session_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  accuracy_m NUMERIC,
  speed_m_s NUMERIC,
  sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id UUID;
BEGIN
  -- Get the trip_id for this session
  SELECT trip_id INTO v_trip_id
  FROM public.driver_tracking_sessions
  WHERE id = p_session_id;
  
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  -- Check if caller is admin or has confirmed reservation for this trip
  IF NOT public.has_role(auth.uid(), 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.reservations
    WHERE trip_id = v_trip_id 
    AND user_id = auth.uid()
    AND status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only confirmed passengers or admins can view positions';
  END IF;
  
  RETURN QUERY
  SELECT 
    dp.lat,
    dp.lng,
    dp.accuracy_m,
    dp.speed_m_s,
    dp.sent_at
  FROM public.driver_positions dp
  WHERE dp.session_id = p_session_id
  ORDER BY dp.sent_at DESC
  LIMIT p_limit;
END;
$$;

-- allocate_seats_atomic: Atomic seat allocation with locking
CREATE OR REPLACE FUNCTION public.allocate_seats_atomic(
  p_trip_id UUID,
  p_user_id UUID,
  p_seats_count INTEGER,
  p_payment_proof_url TEXT DEFAULT NULL,
  p_payment_transaction_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  reservation_id UUID,
  queue_position INTEGER,
  success BOOLEAN,
  error_code TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_seats INTEGER;
  v_car_capacity INTEGER;
  v_current_booked INTEGER;
  v_queue_position INTEGER;
  v_reservation_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Lock the trip row for update to prevent concurrent overbooking
  SELECT t.available_seats, c.capacity INTO v_available_seats, v_car_capacity
  FROM public.trips t
  JOIN public.cars c ON t.car_id = c.id
  WHERE t.id = p_trip_id
  FOR UPDATE;
  
  IF v_available_seats IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, FALSE, '404', 'الرحلة مش موجودة';
    RETURN;
  END IF;
  
  -- Check if user already has a reservation for this trip
  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE trip_id = p_trip_id AND user_id = p_user_id AND status NOT IN ('cancelled')
  ) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, FALSE, '409', 'أنت محجوز في الرحلة دي قبل كده';
    RETURN;
  END IF;
  
  -- Check available seats
  IF v_available_seats < p_seats_count THEN
    RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, FALSE, '409', 'مفيش مقاعد كفاية. المتاح: ' || v_available_seats;
    RETURN;
  END IF;
  
  -- Get next queue position
  SELECT COALESCE(MAX(r.queue_position), 0) + 1 INTO v_queue_position
  FROM public.reservations r
  WHERE r.trip_id = p_trip_id;
  
  -- Set expiry for temporary reservation (20 minutes)
  v_expires_at := now() + interval '20 minutes';
  
  -- Insert reservation
  INSERT INTO public.reservations (
    trip_id,
    user_id,
    seats_count,
    queue_position,
    payment_proof_url,
    payment_transaction_id,
    status,
    payment_status
  )
  VALUES (
    p_trip_id,
    p_user_id,
    p_seats_count,
    v_queue_position,
    p_payment_proof_url,
    p_payment_transaction_id,
    'pending',
    'pending'
  )
  RETURNING id INTO v_reservation_id;
  
  -- Update available seats
  UPDATE public.trips
  SET available_seats = available_seats - p_seats_count,
      is_full = (available_seats - p_seats_count <= 0)
  WHERE id = p_trip_id;
  
  -- Log the action
  PERFORM public.log_action('reservations', 'create', v_reservation_id, NULL, 
    jsonb_build_object('trip_id', p_trip_id, 'seats', p_seats_count, 'queue_position', v_queue_position));
  
  RETURN QUERY SELECT v_reservation_id, v_queue_position, TRUE, NULL::TEXT, NULL::TEXT;
END;
$$;

-- ===== 2. ADD MISSING COLUMNS IF NOT EXISTS =====

-- Add allows_background to driver_tracking_sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'driver_tracking_sessions' 
    AND column_name = 'allows_background'
  ) THEN
    ALTER TABLE public.driver_tracking_sessions ADD COLUMN allows_background BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ===== 3. CREATE INDEXES FOR PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_reservations_trip_status ON public.reservations(trip_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status ON public.reservations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_driver_positions_session_sent ON public.driver_positions(session_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_trip_status ON public.driver_tracking_sessions(trip_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON public.sms_logs(created_at DESC);

-- ===== 4. ENSURE RLS IS ENABLED ON ALL TABLES =====

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===== 5. GRANT EXECUTE ON SECURITY DEFINER FUNCTIONS =====

GRANT EXECUTE ON FUNCTION public.log_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver_view_for_trip TO authenticated;
GRANT EXECUTE ON FUNCTION public.passenger_queue_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tracking_positions_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_seats_atomic TO authenticated;

-- ===== 6. ADD POLICY FOR AUTHENTICATED USERS TO INSERT AUDIT LOGS =====

DROP POLICY IF EXISTS "Allow log_action inserts" ON public.audit_logs;
CREATE POLICY "Allow log_action inserts" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ===== 7. ENABLE REALTIME FOR KEY TABLES =====

DO $$
BEGIN
  -- Enable realtime for reservations if not already
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;
  
  -- Enable realtime for trips
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
  END IF;
  
  -- Enable realtime for votes
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
  END IF;
END $$;