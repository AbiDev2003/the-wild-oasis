// Supabase Edge Function — auto-cancel
// Scheduled cron job that runs daily.
// Cancels unconfirmed bookings whose startDate has passed,
// and sends a cancellation email to the guest.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "The Wild Oasis <onboarding@resend.dev>";
const RESEND_API = Deno.env.get("RESEND_API_URL") ?? "https://api.resend.com/emails";

// Supabase admin client — uses service_role key to bypass RLS
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// ─── Cron schedule: runs daily at 3:00 AM ────────────────────────────────
export const schedule = "0 3 * * *";

serve(async () => {
  try {
    // Step 1: Find unconfirmed bookings whose startDate has passed
    const now = new Date().toISOString();

    const { data: expiredBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, guests(fullName, email), startDate")
      .eq("status", "unconfirmed")
      .lt("startDate", now);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
      });
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      console.log("auto-cancel: No expired bookings found");
      return new Response(JSON.stringify({ cancelled: 0 }));
    }

    // Step 2: Cancel all expired bookings
    const expiredIds = expiredBookings.map((b) => b.id);

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .in("id", expiredIds);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
      });
    }

    // Step 3: Send cancellation emails (fire-and-forget, concurrent)
    const emailResults = await Promise.allSettled(
      expiredBookings.map(async (booking) => {
        const email = booking.guests?.email;
        if (!email) return;

        const emailPayload = {
          from: RESEND_FROM,
          to: [email],
          subject: `Your booking has been cancelled`,
          html: `
            <h2>Booking Cancelled</h2>
            <p>Dear ${booking.guests?.fullName || "Guest"},</p>
            <p>
              Your booking #${booking.id} (start date: ${booking.startDate})
              has been automatically cancelled because it was not confirmed
              by the arrival date.
            </p>
            <p>
              If you'd like to rebook, please visit our website.
            </p>
          `,
        };

        const res = await fetch(RESEND_API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });

        if (!res.ok) {
          const result = await res.json();
          throw new Error(`Resend error for #${booking.id}: ${JSON.stringify(result)}`);
        }
      }),
    );

    // Log any failures
    for (const result of emailResults) {
      if (result.status === "rejected") {
        console.error("auto-cancel email failed:", result.reason);
      }
    }

    console.log(`auto-cancel: Cancelled ${expiredIds.length} bookings`);
    return new Response(JSON.stringify({ cancelled: expiredIds.length }));
  } catch (err) {
    console.error("auto-cancel error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
