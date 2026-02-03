-- Add INSERT policy for profiles table
-- This allows users to create their own profile during registration
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Add explicit DELETE restriction for profiles (only admins can delete)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));