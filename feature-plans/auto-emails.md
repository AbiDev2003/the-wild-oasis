# Auto-Emails & Invoice PDF Feature Plan

## Overview

Automatic email system covering the full booking lifecycle, plus PDF invoice generation with QR-based verification on checkout.

### 5 Core Email Flows

| # | Email | Trigger | Content Highlights |
|---|-------|---------|-------------------|
| 1 | **Booking Confirmation** | Booking created → `unconfirmed` | Booking summary, 48hr warning |
| 2 | **Booking Confirmed** | Admin confirms → `confirmed` | Final confirmation, check-in details |
| 3 | **Check-in Confirmation** | Staff checks in | Welcome, wifi, restaurant menu |
| 4 | **Checkout + Invoice** | Staff checks out | Final invoice PDF (with QR), thank you |
| 5 | **Auto-Cancellation Alert** | startDate passed + still `unconfirmed` | Cancellation notice, 48hr rule reference |

### Nice-to-haves (skip v1)
- Pre-arrival reminder (24hr before)
- Post-stay follow-up (review request)

---

## Compatibility Assessment ✅

| Requirement | Current Project Status |
|------------|----------------------|
| **PDF generation** | ✅ `@react-pdf/renderer` installed — `InvoicePDF.jsx` created |
| **Email service** | ✅ 3 Edge Functions created (`send-email`, `send-invoice`, `auto-cancel`) + `emailService.js` |
| **Bookings API** | `getBooking(id)` returns full data (guests, cabins, prices) ✅ |
| **Restaurant API** | `getRestaurantOrders(bookingId)` returns items ✅ |
| **Check-in hook** | `useCheckin.js` — `onSuccess` callback ✅ |
| **Check-out hook** | `useCheckout.js` — `onSuccess` callback ✅ |
| **Booking trigger** | Booking creation happens in `useCreateBooking` or via admin panel |
| **Settings** | `getSettings()` provides hotel name, breakfast price ✅ |

**Verdict:** Fully compatible. Only need `@react-pdf/renderer` and a Supabase Edge Function as new dependencies.

---

## Email Architecture

```
[Frontend action] → [onSuccess hook] → [generateEmailData(bookingId)]
                                            ↓
                                    [Supabase Edge Function]
                                            ↓
                                      [Resend API]
                                            ↓
                                      [Guest inbox]
```

- **Frontend** sends only the `bookingId` + email type to the Edge Function
- **Edge Function** fetches booking data, renders email template, sends via Resend
- **PDF invoice** is generated client-side (via `@react-pdf/renderer`), sent as attachment
- All email sends are **fire-and-forget** — UI never waits or blocks on them

---

## 1. Email: Booking Confirmation (unconfirmed) ⏳ (hook wiring pending)

### Trigger
Booking is created with status `unconfirmed` — either by guest (public form) or admin.

### Content
- Thank you, booking summary (cabin, dates, guests)
- Price estimate
- **48hr warning:** *"If this booking is not confirmed within 48 hours of your arrival date, it will be automatically cancelled."*
- "How to confirm" instructions (payment link or contact info)

### Hooks to modify
- `useCreateBooking.js` (if public booking form exists)
- Admin booking creation flow

---

## 2. Email: Booking Confirmed (confirmed) ⏳ (hook wiring pending)

### Trigger
Admin changes status from `unconfirmed` → `confirmed`.

### Content
- Final confirmation with booking reference
- Check-in time, address, directions
- What to bring (ID, etc.)
- Link to restaurant menu

### Hooks to modify
- `useUpdateBooking.js` — detect status change to `confirmed`

---

## 3. Email: Check-in Confirmation ⏳ (hook wiring pending)

### Trigger
Staff clicks "Check in" in `useCheckin.js`.

### Content
- Welcome message
- WiFi credentials (from settings)
- Restaurant menu link or QR
- Emergency contacts
- Check-out time reminder

---

## 4. Email: Checkout + Invoice PDF ⏳ (hook wiring pending)

### Trigger
Staff clicks "Check out" in `useCheckout.js`.

### Content
- Thank you for staying
- Final invoice PDF attachment (see section 6)
- QR code in PDF → scan to verify invoice on website
- "Book again" link

### Implementation detail
The invoice PDF includes a QR code linking to a public verification page:
```
https://the-wild-oasis.com/verify-invoice?bookingId=24
```
This page reads the booking from Supabase (public read-only) and displays the raw invoice data — proving the PDF hasn't been tampered with.

---

## 5. Email: Auto-Cancellation Alert ✅ (Edge Function created, pending deploy)

### Trigger
A booking's `startDate` has passed and status is still `unconfirmed`. This runs as part of the 48-hour archival filter logic — when the system hides the booking from the UI, it also fires the cancellation email.

Two implementation options:
- **Option A:** On-the-fly — when the archival filter hides a booking during a `getBookings()` query, fire the email (complex, side-effect in a query)
- **Option B (cleaner):** Supabase cron job (`pg_cron` or Edge Function cron) that runs daily, finds bookings where `status = 'unconfirmed' AND startDate < now() - 2 days`, sends email + updates status to `cancelled` in DB

Option B is recommended. The booking is hard-cancelled in the DB, so the archival filter doesn't even need to handle it — it's simply `status ≠ cancelled`.

### Content
- *"Your booking has been cancelled because it was not confirmed within 48 hours of your arrival date."*
- Booking reference
- Offer to rebook with a discount link

### New files
- `supabase/functions/auto-cancel/index.ts` — cron job
- Email template for "auto-cancellation"

---

## 6. Invoice PDF

### 6.1 Dependency ✅
```bash
npm install @react-pdf/renderer ✅
```

### 6.2 Files Created / To Do

#### `src/features/invoice/InvoicePDF.jsx` ✅
React component using `@react-pdf/renderer` (`Document`, `Page`, `Text`, `View`, `StyleSheet`):

- **Header:** Hotel name, "INVOICE" title, Booking #, dates
- **Guest Info:** Name, email, national ID
- **Cabin Info:** Cabin name, nights, guests
- **Price Breakdown:**
  - Cabin price
  - Breakfast (quantity × unit price)
  - Miscellaneous charges
  - Restaurant orders (if any)
  - **Total**
- **Payment Status:** Paid / Unpaid
- **QR Code:** Auto-generated QR linking to verification URL
- **Footer:** Check-in/out timestamps, booking creation date

#### `src/features/invoice/useGenerateInvoice.js` ✅
Custom hook that:
1. Fetches booking data via `getBooking(id)`
2. Fetches restaurant orders via `getRestaurantOrders(id)`
3. Generates PDF blob using `@react-pdf/renderer` (`pdf()` instance)
4. Returns the PDF blob

#### `src/features/invoice/sendInvoiceEmail.js` ✅
Utility that sends the invoice email:
```js
// Sends PDF blob + guest email to Supabase Edge Function
// Edge Function uses Resend to deliver
```

#### `supabase/functions/send-invoice/index.ts` ✅
Edge Function that receives PDF buffer + recipient email, sends via Resend.

#### `supabase/functions/send-email/index.ts` ✅ (new — handles 3 email types)
Generic Edge Function that receives `bookingId + type`, fetches data, sends via Resend.

#### `src/services/emailService.js` ✅ (new — frontend email utility)
Fire-and-forget utility called by hooks to trigger emails via `send-email` Edge Function.

### 6.3 Mockup
```
┌─────────────────────────────────────────────┐
│           THE WILD OASIS                     │
│              I N V O I C E                   │
│                                              │
│  Booking #24          Date: Jun 20, 2026    │
│                                              │
│  ─── GUEST ───                              │
│  Name:  John Doe                            │
│  Email: john@example.com                    │
│  ID:    1234-5678-9012                      │
│                                              │
│  ─── STAY ───                               │
│  Cabin:  003                                 │
│  Check-in:  Jun 15, 2026                    │
│  Check-out: Jun 20, 2026                    │
│  Nights:  5  |  Guests:  2                  │
│                                              │
│  ─── CHARGES ───                            │
│  Cabin (5 nights × $300)     $1,500.00      │
│  Breakfast (10 × $15)        $150.00        │
│  Miscellaneous                $25.00         │
│  Restaurant Orders            $45.00         │
│  ─────────────────────────────────────       │
│  TOTAL                       $1,720.00       │
│  STATUS:                     PAID ✅         │
│                                              │
│  ┌─────────────────────────┐                 │
│  │  ████████████████████   │                 │
│  │  ██  VERIFY INVOICE ██  │  ← scan me     │
│  │  ████████████████████   │                 │
│  │  ████████████████████   │                 │
│  └─────────────────────────┘                 │
│                                              │
│  Checked in:  Jun 15, 2026, 2:30 PM         │
│  Checked out: Jun 20, 2026, 11:00 AM        │
│  Booked:      May 01, 2026, 10:15 AM        │
└─────────────────────────────────────────────┘
```

---

## 7. Implementation Order

| Step | Action | Files | Status |
|------|--------|-------|--------|
| 1 | Install `@react-pdf/renderer` | `package.json` | ✅ |
| 2 | Create `InvoicePDF.jsx` — PDF layout component | `src/features/invoice/InvoicePDF.jsx` | ✅ |
| 3 | Create `useGenerateInvoice.js` — fetches data, generates PDF blob | `src/features/invoice/useGenerateInvoice.js` | ✅ |
| 4 | Create `sendInvoiceEmail.js` — sends email via Edge Function | `src/features/invoice/sendInvoiceEmail.js` | ✅ |
| 5 | Create Supabase Edge Function `send-invoice` | `supabase/functions/send-invoice/index.ts` | ✅ |
| 6 | Create `emailService.js` — frontend email utility | `src/services/emailService.js` | ✅ |
| 7 | Create `send-email` Edge Function (generic handler) | `supabase/functions/send-email/index.ts` | ✅ |
| 8 | Create `auto-cancel` Edge Function + cron schedule | `supabase/functions/auto-cancel/index.ts` | ✅ |
| 9 | Wire checkout email + PDF into `useCheckout.js` | `src/features/check-in-out/useCheckout.js` | 📝 **NEXT** |
| 10 | Wire check-in email into `useCheckin.js` | `src/features/check-in-out/useCheckin.js` | ⏳ |
| 11 | Wire booking-confirmation email into `useCreateBooking.js` | `src/features/bookings/useCreateBooking.js` | ⏳ |
| 12 | Wire booking-confirmed email into `useEditBooking.js` | `src/features/bookings/useEditBooking.js` | ⏳ |
| 13 | Deploy all 3 Edge Functions to Supabase | `supabase functions deploy ...` | ⏳ |
| 14 | Add wifi fields to settings (Phase 6) | `UpdateSettingsForm.jsx` | ⏳ |

---

## 8. Known Remaining Issues (to build later)

- **QR code in InvoicePDF.jsx** — currently a text `[QR Code]` placeholder. Needs a QR library (e.g., `qrcode`) rendered as an image in `@react-pdf/renderer`.
- **Verification page** — the QR links to `https://the-wild-oasis.com/verify-invoice?bookingId=X` but no route/component exists yet.

---

## 9. Key Considerations

- **PDF generation is client-side** — uses browser APIs, works offline after deps load
- **Email sending should be async + non-blocking** — fire-and-forget, never block the UI
- **Error handling** — if PDF/email fails, the core action (check-in/out/confirm) still succeeds; log the error, optionally show error toast
- **Guest email may be missing** — skip email if no email, still generate PDF if applicable
- **QR verification page** should be read-only, public, and only expose non-sensitive data (no payment info, national ID)
- **Restaurant orders** only appear on checkout invoice (after dining)
- **Auto-cancel cron** runs daily at 3 AM — cancels unconfirmed bookings whose `startDate` has passed

---

## 10. Production Deployment Checklist

### Edge Function Deployment

After code changes, re-deploy affected functions:
```bash
supabase functions deploy send-email
supabase functions deploy send-invoice
supabase functions deploy auto-cancel
```

### Frontend Build

```bash
npm run build
```
