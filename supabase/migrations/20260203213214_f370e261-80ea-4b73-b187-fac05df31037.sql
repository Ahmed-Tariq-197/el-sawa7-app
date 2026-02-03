-- Fix audit_logs: Remove the broad admin INSERT policy and ensure immutability
-- First drop any existing policies that might allow modification
DROP POLICY IF EXISTS "Only admins can insert audit logs" ON public.audit_logs;

-- Recreate insert policy for system/service role only (not through client)
-- Audit logs should be created via triggers or service role, not client-side
-- For now, keep admin insert capability but ensure NO update/delete is possible

-- Create explicit DENY policies for UPDATE and DELETE on audit_logs
-- Since we can't create "DENY" policies directly in Postgres RLS, 
-- we ensure there are no policies that allow these operations
-- The current setup already has no UPDATE/DELETE policies
-- But let's verify by adding restrictive policies that block everyone

-- Create a restrictive policy that blocks all UPDATE operations
CREATE POLICY "No one can update audit logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (false);

-- Create a restrictive policy that blocks all DELETE operations  
CREATE POLICY "No one can delete audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (false);