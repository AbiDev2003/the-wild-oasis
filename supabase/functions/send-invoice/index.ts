// Supabase Edge Function — send-invoice
// Triggered by the frontend after checkout.
// Decodes the PDF from base64 and sends it as an email attachment via Resend.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Resend config — values set via `supabase secrets set`
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "The Wild Oasis <onboarding@resend.dev>";
const RESEND_API = Deno.env.get("RESEND_API_URL") ?? "https://api.resend.com/emails";

// CORS headers for local dev
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { bookingId, recipientEmail, pdfBase64 } = await req.json();

    // Validate required fields
    if (!bookingId || !recipientEmail || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "Missing bookingId, recipientEmail, or pdfBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Decode base64 to a Uint8Array for the attachment
    const binaryStr = atob(pdfBase64);
    const pdfBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      pdfBytes[i] = binaryStr.charCodeAt(i);
    }

    // Build the email payload for Resend
    const emailPayload = {
      from: RESEND_FROM,
      to: [recipientEmail],
      subject: `Your Invoice — Booking #${bookingId}`,
      html: `
        <h2>Thank you for staying at The Wild Oasis!</h2>
        <p>Your final invoice for booking #${bookingId} is attached.</p>
        <p>We hope you enjoyed your stay!</p>
      `,
      attachments: [
        {
          filename: `invoice-booking-${bookingId}.pdf`,
          content: [...pdfBytes], // Resend accepts byte arrays
        },
      ],
    };

    // Send via Resend API
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: "Resend delivery failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-invoice error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
