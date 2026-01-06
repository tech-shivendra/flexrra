import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
}

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendOTPRequest = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!resendApiKey) {
      console.error("Missing Resend API key");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiry

    // Delete any existing OTPs for this email
    await supabase
      .from("email_otps")
      .delete()
      .eq("email", email);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("email_otps")
      .insert({
        email,
        otp,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send OTP via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Flexrra <onboarding@resend.dev>",
      to: [email],
      subject: "Your Flexrra Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">Flexrra</h1>
            <p style="color: #6b7280; margin-top: 5px;">Your Fitness Journey Starts Here</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px;">
            <p style="color: white; margin: 0 0 15px 0; font-size: 16px;">Your verification code is:</p>
            <div style="background: white; border-radius: 8px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #6b7280; text-align: center; font-size: 14px;">
            This code expires in 5 minutes. If you didn't request this code, please ignore this email.
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 Flexrra. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      // Clean up the stored OTP if email failed
      await supabase.from("email_otps").delete().eq("email", email);
      return new Response(
        JSON.stringify({ error: "Failed to send OTP email. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`OTP sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
