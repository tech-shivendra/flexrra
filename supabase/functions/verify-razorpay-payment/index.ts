import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT and get user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid or expired authentication token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      user_id,
      plan_type = 'monthly'
    } = await req.json();

    // Verify that the user_id matches the authenticated user (prevent spoofing)
    if (user_id && user_id !== user.id) {
      console.error('User ID mismatch - potential spoofing attempt');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User ID mismatch' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Verifying Razorpay payment:', { 
      order_id: razorpay_order_id, 
      payment_id: razorpay_payment_id,
      user_id: user.id 
    });

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeySecret) {
      console.error('Razorpay secret not configured');
      throw new Error('Payment gateway not configured');
    }

    // Verify the payment signature using Web Crypto API
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const encoder = new TextEncoder();
    const key = encoder.encode(razorpayKeySecret);
    const message = encoder.encode(body);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Signature verification:', { 
      expected: expectedSignature, 
      received: razorpay_signature 
    });

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      throw new Error('Payment verification failed - invalid signature');
    }

    console.log('Payment signature verified successfully');

    // Fetch payment details from Razorpay to confirm
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const authToken = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
        },
      }
    );

    const paymentData = await paymentResponse.json();

    if (paymentData.status !== 'captured') {
      console.error('Payment not captured:', paymentData.status);
      throw new Error('Payment not completed');
    }

    console.log('Payment confirmed as captured:', paymentData.id);

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days for monthly plan

    // Return success with subscription details
    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: paymentData.amount / 100, // Convert from paise to rupees
        status: paymentData.status,
      },
      subscription: {
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        plan: plan_type,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in verify-razorpay-payment function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
