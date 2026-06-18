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
    "totalPrice" = "numNights" * (NEW."regularPrice" - NEW."discount") + "extrasPrice" + COALESCE("miscellaneousPrice", 0)
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
--
-- 2024-06-12: Updated formula from all-or-nothing
--   (numNights * numGuests * breakfastPrice) to flexible
--   per-guest-day model (numBreakfast * breakfastPrice).
--   The column hasBreakfast is being phased out; we now
--   check numBreakfast > 0 instead.
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_breakfast_prices()
RETURNS trigger AS $$
BEGIN
  UPDATE bookings
  SET
    -- New formula: total breakfast guest-days × price per serving
    -- Example: 2 guests × 2 days + 1 guest × 3 days = 7 breakfasts
    "extrasPrice" = "numBreakfast" * NEW."breakfastPrice",
    "totalPrice" = "cabinPrice" + "numBreakfast" * NEW."breakfastPrice" + COALESCE("miscellaneousPrice", 0)
  WHERE "numBreakfast" > 0 AND "status" != 'checked-out';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_breakfast_price_update ON settings;
CREATE TRIGGER settings_breakfast_price_update
  AFTER UPDATE OF "breakfastPrice" ON settings
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_breakfast_prices();

-- ============================================================
-- Trigger 3: Restaurant order insert/update/delete
-- ------------------------------------------------------------
-- Why: When a guest orders food, the booking totalPrice should
--      include it immediately. This trigger recalculates
--      totalPrice = cabinPrice + extrasPrice + miscellaneousPrice
--      + SUM of all restaurant order totals for that booking.
--      Checked-out bookings are excluded.
-- ============================================================

CREATE OR REPLACE FUNCTION update_booking_total_with_restaurant()
RETURNS trigger AS $$
DECLARE
  booking_id BIGINT;
  restaurant_sum NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    booking_id := OLD."bookingid";
  ELSE
    booking_id := NEW."bookingid";
  END IF;

  SELECT COALESCE(SUM("totalprice"), 0) INTO restaurant_sum
  FROM "restaurantorders"
  WHERE "bookingid" = booking_id;

  UPDATE bookings
  SET "totalPrice" = "cabinPrice" + "extrasPrice" + COALESCE("miscellaneousPrice", 0) + restaurant_sum
  WHERE id = booking_id AND "status" != 'checked-out';

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS restaurant_orders_total_update ON "restaurantorders";
CREATE TRIGGER restaurant_orders_total_update
  AFTER INSERT OR UPDATE OR DELETE ON "restaurantorders"
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_total_with_restaurant();

-- ============================================================
-- Trigger 4: Safety net — BEFORE UPDATE on bookings
-- ------------------------------------------------------------
-- Why: Any code path that updates bookings.totalPrice (check-in,
--      booking edit, cabin price change, breakfast price change)
--      may forget to include restaurant orders. This trigger
--      automatically re-adds the restaurant sum before the write,
--      so totalPrice is always: cabinPrice + extrasPrice +
--      miscellaneousPrice + SUM of restaurant orders.
--
--      Only fires for non-checked-out bookings.
-- ============================================================

CREATE OR REPLACE FUNCTION ensure_restaurant_in_total_price()
RETURNS trigger AS $$
DECLARE
  restaurant_sum NUMERIC;
BEGIN
  IF NEW."status" = 'checked-out' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM("totalprice"), 0) INTO restaurant_sum
  FROM "restaurantorders"
  WHERE "bookingid" = NEW.id;

  NEW."totalPrice" = NEW."cabinPrice" + NEW."extrasPrice" + COALESCE(NEW."miscellaneousPrice", 0) + restaurant_sum;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_restaurant_in_total_price ON bookings;
CREATE TRIGGER ensure_restaurant_in_total_price
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_restaurant_in_total_price();
