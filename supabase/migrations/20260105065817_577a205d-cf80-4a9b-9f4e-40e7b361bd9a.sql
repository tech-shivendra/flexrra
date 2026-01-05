-- Create secure RPC function for session deduction
CREATE OR REPLACE FUNCTION public.deduct_session(p_subscription_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subscription RECORD;
  v_new_remaining INTEGER;
BEGIN
  -- Get the subscription and verify ownership
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE id = p_subscription_id
    AND user_id = auth.uid()
    AND status = 'active';
  
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active subscription found or not authorized');
  END IF;
  
  -- Check if subscription has expired
  IF v_subscription.end_date < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription has expired');
  END IF;
  
  -- Check remaining sessions
  IF v_subscription.remaining_sessions <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No sessions remaining');
  END IF;
  
  -- Deduct exactly 1 session
  v_new_remaining := v_subscription.remaining_sessions - 1;
  
  UPDATE public.subscriptions
  SET remaining_sessions = v_new_remaining
  WHERE id = p_subscription_id
    AND user_id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'remaining_sessions', v_new_remaining);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_session(UUID) TO authenticated;