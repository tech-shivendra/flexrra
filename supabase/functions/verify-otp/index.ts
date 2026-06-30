import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyOTPRequest = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the stored OTP for this email
    const { data: otpRecord, error: fetchError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      console.log("No OTP found for email:", email);
      return new Response(
        JSON.stringify({ error: "No OTP found for this email. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase.from("email_otps").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "OTP has expired. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      const newAttempts = (otpRecord.attempts ?? 0) + 1;
      const MAX_ATTEMPTS = 5;
      if (newAttempts >= MAX_ATTEMPTS) {
        await supabase.from("email_otps").delete().eq("id", otpRecord.id);
        return new Response(
          JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      await supabase
        .from("email_otps")
        .update({ attempts: newAttempts })
        .eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: `Invalid OTP. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // OTP is valid - mark as verified and delete
    await supabase.from("email_otps").delete().eq("id", otpRecord.id);

    console.log(`OTP verified successfully for email: ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP verified successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify OTP" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
