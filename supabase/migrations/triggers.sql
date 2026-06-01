-- Run this in Supabase SQL editor
--
-- These triggers keep booking prices in sync when cabin rates or
-- settings change. Without them, changing a cabin's price would
-- only affect new bookings — existing ones would keep the old rate.
--
-- Checked-out bookings are excluded (status != 'checked-out')
-- because those transactions are finalized.

-- ============================================================
-- Trigger 1: Cabin price/discount change
-- ------------------------------------------------------------
-- Why: If "Cabin 003" price goes from $200 to $250, all existing
--      non-checked-out bookings for Cabin 003 should reflect the
--      new nightly rate. This recalculates cabinPrice and totalPrice
--      using the updated regularPrice and discount.
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_booking_prices()
RETURNS trigger AS $$
BEGIN
  UPDATE bookings
  SET
    "cabinPrice" = "numNights" * (NEW."regularPrice" - NEW."discount"),
    "totalPrice" = "numNights" * (NEW."regularPrice" - NEW."discount") + "extrasPrice"
  WHERE "cabinId" = NEW.id AND "status" != 'checked-out';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cabin_price_update ON cabins;
CREATE TRIGGER cabin_price_update
  AFTER UPDATE OF "regularPrice", "discount" ON cabins
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_booking_prices();

-- ============================================================
-- Trigger 2: Breakfast price change in settings
-- ------------------------------------------------------------
-- Why: The admin might update the breakfast price in settings
--      (e.g., $15 → $20). All existing non-checked-out bookings
--      that include breakfast should update extrasPrice and
--      totalPrice to reflect the new rate.
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_breakfast_prices()
RETURNS trigger AS $$
BEGIN
  UPDATE bookings
  SET
    "extrasPrice" = "numNights" * NEW."breakfastPrice" * "numGuests",
    "totalPrice" = "cabinPrice" + "numNights" * NEW."breakfastPrice" * "numGuests"
  WHERE "hasBreakfast" = true AND "status" != 'checked-out';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_breakfast_price_update ON settings;
CREATE TRIGGER settings_breakfast_price_update
  AFTER UPDATE OF "breakfastPrice" ON settings
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_breakfast_prices();
