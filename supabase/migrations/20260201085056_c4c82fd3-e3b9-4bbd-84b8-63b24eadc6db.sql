-- Allow users to delete their own votes
CREATE POLICY "Users can delete their own votes"
ON public.votes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);