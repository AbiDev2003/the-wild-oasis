// Supabase Edge Function — send-email
// Generic handler for 3 transactional email types:
//   - booking-confirmation
//   - booking-confirmed
//   - check-in
//
// The frontend sends only { bookingId, type }.
// This function fetches the booking data, builds an HTML template,
// and sends via Resend.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config from secrets ──────────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM =
  Deno.env.get("RESEND_FROM_EMAIL") ??
  "The Wild Oasis <onboarding@resend.dev>";
const RESEND_API = Deno.env.get("RESEND_API_URL") ?? "https://api.resend.com/emails";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// ─── CORS ─────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── HTML Templates ───────────────────────────────────────────────────────

function bookingConfirmationHtml(booking: any, guest: any, cabin: any) {
  return `
    <h2>Booking Confirmation — #${booking.id}</h2>
    <p>Thank you for your reservation at The Wild Oasis!</p>

    <table style="width:100%; border-collapse:collapse;">
      <tr><td><strong>Cabin:</strong></td><td>${cabin.name}</td></tr>
      <tr><td><strong>Check-in:</strong></td><td>${booking.startDate}</td></tr>
      <tr><td><strong>Check-out:</strong></td><td>${booking.endDate}</td></tr>
      <tr><td><strong>Nights:</strong></td><td>${booking.numNights}</td></tr>
      <tr><td><strong>Guests:</strong></td><td>${booking.numGuests}</td></tr>
      <tr><td><strong>Total:</strong></td><td>$${booking.totalPrice}</td></tr>
    </table>

    <p style="color:#d97706; font-weight:bold; margin-top:20px;">
      ⏳ Important: If this booking is not confirmed by your arrival
      date, it will be automatically cancelled.
    </p>
    <p>Please contact us to confirm your booking.</p>

    <hr>
    <p style="color:#666; font-size:12px;">The Wild Oasis</p>
  `;
}

function bookingConfirmedHtml(booking: any, guest: any, cabin: any) {
  return `
    <h2>Booking Confirmed — #${booking.id}</h2>
    <p>Dear ${guest.fullName},</p>
    <p>Your booking has been confirmed! Here are your details:</p>

    <table style="width:100%; border-collapse:collapse;">
      <tr><td><strong>Cabin:</strong></td><td>${cabin.name}</td></tr>
      <tr><td><strong>Check-in:</strong></td><td>${booking.startDate}</td></tr>
      <tr><td><strong>Check-out:</strong></td><td>${booking.endDate}</td></tr>
    </table>

    <p><strong>Check-in time:</strong> 2:00 PM</p>
    <p><strong>Address:</strong> The Wild Oasis, Wilderness Road</p>
    <p>Please bring a valid ID for check-in.</p>
    <p><a href="https://the-wild-oasis.com/restaurant">View our restaurant menu</a></p>

    <hr>
    <p style="color:#666; font-size:12px;">The Wild Oasis</p>
  `;
}

function checkInHtml(booking: any, guest: any, cabin: any) {
  return `
    <h2>Welcome to The Wild Oasis!</h2>
    <p>Dear ${guest.fullName},</p>
    <p>You are now checked in to <strong>${cabin.name}</strong>.</p>

    <p><strong>WiFi:</strong> Ask reception for network credentials.</p>
    <p><a href="https://the-wild-oasis.com/restaurant">View our restaurant menu</a></p>
    <p><strong>Emergency contact:</strong> +1-555-000-1234</p>

    <p style="margin-top:20px;">
      <strong>Check-out time:</strong> 11:00 AM
    </p>
    <p>We hope you enjoy your stay!</p>

    <hr>
    <p style="color:#666; font-size:12px;">The Wild Oasis</p>
  `;
}

// ─── Handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { bookingId, type } = await req.json();

    if (!bookingId || !type) {
      return new Response(
        JSON.stringify({ error: "Missing bookingId or type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch booking with related data
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, cabins(*), guests(*)")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const guest = booking.guests;
    if (!guest?.email) {
      console.warn(`send-email: No email for booking #${bookingId}, skipping`);
      return new Response(JSON.stringify({ skipped: true, reason: "no email" }));
    }

    // Choose template
    let subject: string;
    let html: string;

    switch (type) {
      case "booking-confirmation":
        subject = `Booking Confirmation — #${bookingId}`;
        html = bookingConfirmationHtml(booking, guest, booking.cabins);
        break;
      case "booking-confirmed":
        subject = `Booking Confirmed — #${bookingId}`;
        html = bookingConfirmedHtml(booking, guest, booking.cabins);
        break;
      case "check-in":
        subject = `Welcome to The Wild Oasis! — #${bookingId}`;
        html = checkInHtml(booking, guest, booking.cabins);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Send via Resend
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [guest.email],
        subject,
        html,
      }),
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
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
