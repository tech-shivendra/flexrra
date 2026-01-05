-- Create secure RPC function for pausing subscriptions
CREATE OR REPLACE FUNCTION public.pause_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_max_pauses INTEGER;
  v_days_since_resume INTEGER;
  v_new_pause_count INTEGER;
BEGIN
  -- Get the user's active subscription
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = auth.uid()
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active subscription found');
  END IF;
  
  -- Calculate max pauses based on plan
  v_max_pauses := CASE WHEN v_subscription.plan = 'annual' THEN 3 ELSE 1 END;
  
  -- Check pause limit
  IF v_subscription.pause_count >= v_max_pauses THEN
    RETURN jsonb_build_object('success', false, 'error', 
      'You have reached the maximum ' || v_max_pauses || ' pause(s) for your ' || v_subscription.plan || ' plan');
  END IF;
  
  -- Check 10-day gap requirement if previously resumed
  IF v_subscription.resumed_at IS NOT NULL THEN
    v_days_since_resume := EXTRACT(DAY FROM (NOW() - v_subscription.resumed_at));
    IF v_days_since_resume < 10 THEN
      RETURN jsonb_build_object('success', false, 'error', 
        'You must wait ' || (10 - v_days_since_resume) || ' more days before pausing again');
    END IF;
  END IF;
  
  -- Perform the pause
  v_new_pause_count := v_subscription.pause_count + 1;
  
  UPDATE public.subscriptions
  SET status = 'paused',
      paused_at = NOW(),
      pause_count = v_new_pause_count
  WHERE id = v_subscription.id;
  
  -- Update profile subscription status
  UPDATE public.profiles
  SET subscription_status = 'paused',
      updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'pause_count', v_new_pause_count);
END;
$$;

-- Create secure RPC function for resuming subscriptions
CREATE OR REPLACE FUNCTION public.resume_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_new_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the user's paused subscription
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = auth.uid()
    AND status = 'paused'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No paused subscription found');
  END IF;
  
  -- Calculate new end date (30 days from now)
  v_new_end_date := NOW() + INTERVAL '30 days';
  
  -- Perform the resume
  UPDATE public.subscriptions
  SET status = 'active',
      resumed_at = NOW(),
      end_date = v_new_end_date
  WHERE id = v_subscription.id;
  
  -- Update profile subscription status
  UPDATE public.profiles
  SET subscription_status = 'active',
      subscription_end_date = v_new_end_date,
      updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'end_date', v_new_end_date);
END;
$$;

-- Remove the overly permissive UPDATE policy for regular users
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.pause_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_subscription() TO authenticated;