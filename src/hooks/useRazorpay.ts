import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export const useRazorpay = () => {
  const { user, session, updateSubscription } = useAuth();
  const { createSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createOrder = async (amount: number) => {
    console.log('Creating Razorpay order for amount:', amount);
    
    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: {
        amount,
        currency: 'INR',
        receipt: `fx_${Date.now()}`,
        notes: {
          user_id: user?.id,
          plan: 'monthly',
        },
      },
    });

    if (error) {
      console.error('Order creation error:', error);
      throw new Error(error.message || 'Failed to create order');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to create order');
    }

    return data;
  };

  const verifyPayment = async (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ) => {
    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });
    
    const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
      body: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        user_id: user?.id,
        plan_type: 'monthly',
      },
    });

    if (error) {
      console.error('Payment verification error:', error);
      throw new Error(error.message || 'Payment verification failed');
    }

    if (!data.success) {
      throw new Error(data.error || 'Payment verification failed');
    }

    return data;
  };

  const initiatePayment = async (
    options: RazorpayOptions,
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order
      const orderData = await createOrder(options.amount);
      console.log('Order created:', orderData);

      // Configure Razorpay options
      const razorpayOptions = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: options.name || 'Flexrra',
        description: options.description || 'Gym Membership Subscription',
        image: options.image || '',
        order_id: orderData.order.id,
        prefill: {
          name: options.prefill?.name || user?.name || '',
          email: options.prefill?.email || user?.email || '',
          contact: options.prefill?.contact || user?.phone || '',
        },
        theme: {
          color: '#14b8a6',
        },
        handler: async (response: any) => {
          console.log('Payment successful, verifying...', response);
          
          try {
            const verificationResult = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            
            console.log('Payment verified:', verificationResult);
            
            // Update subscription in database
            await createSubscription(
              response.razorpay_order_id,
              response.razorpay_payment_id
            );
            
            onSuccess({
              ...response,
              subscription: verificationResult.subscription,
            });
          } catch (verifyError: any) {
            console.error('Verification failed:', verifyError);
            onFailure({ error: verifyError.message });
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
            setIsLoading(false);
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        onFailure(response.error);
        setIsLoading(false);
      });
      razorpay.open();

    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.message);
      onFailure({ error: err.message });
      setIsLoading(false);
    }
  };

  return {
    initiatePayment,
    isLoading,
    error,
  };
};
