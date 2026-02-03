-- =====================================================
-- ELSAWA7 TRACKING & REMAINING WORK MIGRATION
-- =====================================================

-- 1. DRIVER TRACKING SESSIONS TABLE
CREATE TABLE public.driver_tracking_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    driver_id uuid NOT NULL REFERENCES public.profiles(id),
    consent_at timestamptz NOT NULL,
    started_at timestamptz NOT NULL,
    ended_at timestamptz,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    created_at timestamptz DEFAULT now()
);

-- 2. DRIVER POSITIONS TABLE
CREATE TABLE public.driver_positions (
    id bigserial PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.driver_tracking_sessions(id) ON DELETE CASCADE,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    accuracy_m numeric,
    speed_m_s numeric,
    sent_at timestamptz DEFAULT now()
);

-- Index for efficient position queries
CREATE INDEX idx_driver_positions_session_sent ON public.driver_positions(session_id, sent_at DESC);

-- 3. SMS LOGS TABLE (for test system)
CREATE TABLE public.sms_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_phone text NOT NULL,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'sent',
    test_mode boolean NOT NULL DEFAULT true,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. ENABLE RLS ON ALL NEW TABLES
ALTER TABLE public.driver_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR driver_tracking_sessions

-- Driver can view their own sessions
CREATE POLICY "Drivers can view their own tracking sessions"
ON public.driver_tracking_sessions
FOR SELECT
USING (auth.uid() = driver_id);

-- Driver can create their own sessions (must be assigned to trip)
CREATE POLICY "Drivers can create tracking sessions for assigned trips"
ON public.driver_tracking_sessions
FOR INSERT
WITH CHECK (
    auth.uid() = driver_id 
    AND EXISTS (
        SELECT 1 FROM public.trips 
        WHERE trips.id = trip_id 
        AND trips.driver_id = auth.uid()
    )
);

-- Driver can update their own sessions (to end them)
CREATE POLICY "Drivers can update their own tracking sessions"
ON public.driver_tracking_sessions
FOR UPDATE
USING (auth.uid() = driver_id);

-- Passengers with confirmed booking can view session for their trip
CREATE POLICY "Confirmed passengers can view trip tracking sessions"
ON public.driver_tracking_sessions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.reservations
        WHERE reservations.trip_id = driver_tracking_sessions.trip_id
        AND reservations.user_id = auth.uid()
        AND reservations.status = 'confirmed'
    )
);

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all tracking sessions"
ON public.driver_tracking_sessions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. RLS POLICIES FOR driver_positions
-- Note: Positions should primarily be accessed via edge functions, but we add policies for safety

-- Drivers can view their own positions (via their sessions)
CREATE POLICY "Drivers can view positions of their sessions"
ON public.driver_positions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.driver_tracking_sessions
        WHERE driver_tracking_sessions.id = session_id
        AND driver_tracking_sessions.driver_id = auth.uid()
    )
);

-- Drivers can insert positions for their active sessions
CREATE POLICY "Drivers can insert positions for active sessions"
ON public.driver_positions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.driver_tracking_sessions
        WHERE driver_tracking_sessions.id = session_id
        AND driver_tracking_sessions.driver_id = auth.uid()
        AND driver_tracking_sessions.status = 'active'
    )
);

-- Confirmed passengers can view positions for their trip's sessions
CREATE POLICY "Confirmed passengers can view positions"
ON public.driver_positions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.driver_tracking_sessions dts
        JOIN public.reservations r ON r.trip_id = dts.trip_id
        WHERE dts.id = session_id
        AND r.user_id = auth.uid()
        AND r.status = 'confirmed'
    )
);

-- Admins can view all positions
CREATE POLICY "Admins can view all positions"
ON public.driver_positions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS POLICIES FOR sms_logs

-- Only admins can view SMS logs
CREATE POLICY "Admins can view SMS logs"
ON public.sms_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- No one can update or delete SMS logs
CREATE POLICY "No one can update SMS logs"
ON public.sms_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No one can delete SMS logs"
ON public.sms_logs
FOR DELETE
TO authenticated
USING (false);

-- 8. FUNCTION TO PURGE OLD TRACKING POSITIONS
CREATE OR REPLACE FUNCTION public.purge_old_tracking_positions(retention_days integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.driver_positions
    WHERE sent_at < (now() - (retention_days || ' days')::interval);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also end stale sessions (older than 24 hours and still active)
    UPDATE public.driver_tracking_sessions
    SET status = 'ended', ended_at = now()
    WHERE status = 'active' 
    AND started_at < (now() - interval '24 hours');
    
    RETURN deleted_count;
END;
$$;

-- 9. ENABLE REALTIME FOR TRACKING (optional, controlled by env var on frontend)
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_tracking_sessions;

-- 10. Add indexes for performance
CREATE INDEX idx_tracking_sessions_trip_status ON public.driver_tracking_sessions(trip_id, status);
CREATE INDEX idx_tracking_sessions_driver ON public.driver_tracking_sessions(driver_id);
CREATE INDEX idx_sms_logs_created ON public.sms_logs(created_at DESC);