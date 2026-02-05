-- Add push notification tables and update trips default price
-- Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Push logs table
CREATE TABLE IF NOT EXISTS public.push_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    subscription_id UUID,
    title TEXT NOT NULL,
    body TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    test_mode BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_logs ENABLE ROW LEVEL SECURITY;

-- Push subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.push_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Push logs policies  
CREATE POLICY "Users can view their own push logs" ON public.push_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all push logs" ON public.push_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage push logs" ON public.push_logs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Update trips price default to 150
ALTER TABLE public.trips ALTER COLUMN price SET DEFAULT 150;

-- Add index for push subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_user_id ON public.push_logs(user_id);