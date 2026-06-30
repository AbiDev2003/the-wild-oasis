import supabase from "./supabase";

/**
 * Supported email types and their human-readable labels.
 */
const EMAIL_TYPES = {
  BOOKING_CONFIRMATION: "booking-confirmation",
  BOOKING_CONFIRMED: "booking-confirmed",
  CHECK_IN: "check-in",
};

/**
 * Send a transactional email for a booking lifecycle event.
 *
 * This is fire-and-forget — it never blocks the caller.
 * Errors are logged but never thrown, so the UI action
 * (check-in, check-out, create booking, etc.) always succeeds.
 *
 * @param {number} bookingId - The booking ID
 * @param {"booking-confirmation" | "booking-confirmed" | "check-in"} type - Email type
 */
export async function sendEmail(bookingId, type) {
  // Validate email type
  if (!Object.values(EMAIL_TYPES).includes(type)) {
    console.error(`emailService: Unknown email type "${type}"`);
    return;
  }

  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { bookingId, type },
    });

    if (error) {
      console.error(
        `emailService: Edge Function error (type: ${type}, booking: #${bookingId}):`,
        error,
      );
    } else {
      console.log(
        `emailService: ${type} email sent for booking #${bookingId}`,
      );
    }
  } catch (err) {
    // Fire-and-forget: log but never throw
    console.error(
      `emailService: Failed (type: ${type}, booking: #${bookingId}):`,
      err,
    );
  }
}
