import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSubscription = () => {
  const { user, session, updateSubscription, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = async (
    razorpayOrderId?: string, 
    razorpayPaymentId?: string,
    planType: 'monthly' | 'annual' = 'monthly',
    price?: number
  ) => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const endDate = new Date();
      const daysToAdd = planType === 'annual' ? 365 : 30;
      endDate.setDate(endDate.getDate() + daysToAdd);
      
      const subscriptionPrice = price || (planType === 'annual' ? 14999 : 1499);
      
      // Insert subscription record
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: planType,
          price: subscriptionPrice,
          status: 'active',
          end_date: endDate.toISOString(),
          razorpay_order_id: razorpayOrderId || null,
          razorpay_payment_id: razorpayPaymentId || null,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update profile subscription status
      await updateSubscription('active', endDate.toISOString());
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSubscription = async () => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update the latest active subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await updateSubscription('paused');
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSubscription = async () => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      // Update the latest paused subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          resumed_at: new Date().toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'paused')
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await updateSubscription('active', endDate.toISOString());
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscriptionStatus: user?.subscription_status || 'inactive',
    subscriptionEndDate: user?.subscription_end_date,
    isLoading,
    error,
    createSubscription,
    pauseSubscription,
    resumeSubscription,
  };
};
