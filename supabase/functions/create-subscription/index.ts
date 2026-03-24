import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify JWT with anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for DB operations (since we removed the user INSERT policy)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      plan_type = "monthly",
      price,
      coupon_code,
      original_price,
      discount_percent,
    } = await req.json();

    // For paid subscriptions, verify that razorpay IDs are provided
    const effectivePrice = price ?? (plan_type === "annual" ? 14999 : 1499);

    if (effectivePrice > 0) {
      if (!razorpay_order_id || !razorpay_payment_id) {
        return new Response(
          JSON.stringify({ success: false, error: "Payment verification required for paid subscriptions" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify payment was actually captured via Razorpay API
      const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
      const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(
          JSON.stringify({ success: false, error: "Payment gateway not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authToken = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const paymentResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
        { headers: { Authorization: `Basic ${authToken}` } }
      );
      const paymentData = await paymentResponse.json();

      if (paymentData.status !== "captured") {
        return new Response(
          JSON.stringify({ success: false, error: "Payment not completed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Free subscription (100% coupon) - validate coupon server-side
      if (!coupon_code) {
        return new Response(
          JSON.stringify({ success: false, error: "Coupon code required for free subscriptions" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: coupon, error: couponError } = await adminClient
        .from("coupons")
        .select("discount_percent, is_active")
        .eq("code", coupon_code)
        .eq("is_active", true)
        .single();

      if (couponError || !coupon || coupon.discount_percent < 100) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid coupon for free subscription" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create subscription
    const daysToAdd = plan_type === "annual" ? 365 : 30;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysToAdd);

    const subscriptionRecord: Record<string, unknown> = {
      user_id: user.id,
      plan: plan_type,
      price: effectivePrice,
      status: "active",
      end_date: endDate.toISOString(),
      razorpay_order_id: razorpay_order_id || null,
      razorpay_payment_id: razorpay_payment_id || null,
    };

    if (coupon_code) {
      subscriptionRecord.coupon_code = coupon_code;
      subscriptionRecord.original_price = original_price;
      subscriptionRecord.discount_percent = discount_percent;
    }

    const { error: insertError } = await adminClient
      .from("subscriptions")
      .insert(subscriptionRecord);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile
    await adminClient
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({ success: true, end_date: endDate.toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-subscription:", error);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
