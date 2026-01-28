-- Fix overly permissive RLS policy for audit_logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Replace with a more restrictive policy - only authenticated users can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);