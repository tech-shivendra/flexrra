import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { amount, currency = 'INR', receipt, notes } = await req.json();

    console.log('Creating Razorpay order:', { amount, currency, receipt });

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not configured');
      throw new Error('Payment gateway not configured');
    }

    // Create order using Razorpay API
    const authToken = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const orderPayload = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    console.log('Sending order request to Razorpay:', orderPayload);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('Razorpay order creation failed:', orderData);
      throw new Error(orderData.error?.description || 'Failed to create order');
    }

    console.log('Razorpay order created successfully:', orderData.id);

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
      },
      key: razorpayKeyId, // Send public key for frontend
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in create-razorpay-order function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
