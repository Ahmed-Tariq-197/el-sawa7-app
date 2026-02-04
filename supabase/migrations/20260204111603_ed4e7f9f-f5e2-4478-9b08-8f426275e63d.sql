-- Fix profiles table: Add policy requiring authentication for SELECT
-- This prevents anonymous users from querying phone numbers and personal data
CREATE POLICY "Require authentication for profiles access" 
ON public.profiles 
FOR SELECT 
TO anon
USING (false);

-- Fix sms_logs table: Block non-admin SELECT access explicitly
-- The existing admin policy uses has_role check, but we need to ensure
-- non-admin authenticated users cannot access the table
CREATE POLICY "Block non-admin SELECT on sms_logs" 
ON public.sms_logs 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));