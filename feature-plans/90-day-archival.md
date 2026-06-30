# 90-Day Archival, 48-Hour Unconfirmed Cleanup & Restaurant Pagination Plan

## Overview

Two auto-cleanup rules to keep the database lean and the UI tidy:

1. **90-day rule:** Checked-out bookings older than 90 days → hidden from UI
2. **48-hour rule:** Unconfirmed bookings whose `startDate` is more than 48 hours past → **auto-deleted on read** (cleanup runs inside `getBookings()`)

The Restaurant route also needs pagination (reusing the existing `Pagination` component).

---

## Compatibility Assessment ✅

| Requirement | Current Status |
|------------|---------------|
| **Date filtering in `getBookings()`** | Supabase supports `.or()` + `.gte()` filters ✅ |
| **Pagination in Bookings route** | Already exists via `Pagination` component + `useBookings` ✅ |
| **Pagination in Restaurant route** | Not yet — loads ALL checked-in bookings at once ❌ |
| **`count` from `getBookings()`** | Already returned by API (`{ count: "exact" }`) ✅ |

---

## Root Cause

Currently, `getBookings()` returns ALL matching records (respecting `PAGE_SIZE` for pagination). But there is no filter to exclude old checked-out or stale unconfirmed bookings. Over time:
- The Bookings table fills with thousands of stale records
- The Restaurant table loads ALL checked-in bookings at once (no pagination)
- Both routes become slow and cluttered

---

## 1. Archival & Cleanup — How They Work

### 90-day Archive (Hide)

Add a **date filter** inside `getBookings()`:

```
( status ≠ "checked-out" OR checkOutAt ≥ 90 days ago )
```

| Status | Condition | Visible? |
|--------|-----------|----------|
| Confirmed / checked-in | Always | ✅ |
| Checked-out < 90 days | Always | ✅ |
| Checked-out > 90 days | Hidden | ❌ |

The filter is skipped when the user explicitly filters by "checked-out".

### 48-hour Cleanup (Delete)

Unconfirmed bookings older than 48 hours are **physically deleted from the database** using a "cleanup on read" strategy — the delete runs at the start of `getBookings()` before the main query.

This means:
- Stale records are purged naturally whenever staff use the app
- No cron, no edge functions, no external services needed
- If nobody opens the app for a week, stale records sit harmlessly and vanish on next visit
- Unconfirmed bookings younger than 48 hours remain untouched

#### Why delete instead of hide?
- Unconfirmed bookings are abandoned — no financial transaction, no audit value
- Hard-deleting keeps the table smaller and queries faster
- Avoids a permanent `.or()` filter on every query

---

## 2. Files to Change

### 2.1 `src/services/apiBookings.js` — Cleanup + archival filter

Inside `getBookings()`, **at the very start** add the cleanup-on-read:

```js
import { subDays } from "date-fns";

export async function getBookings({ filter, sortBy, page, search }) {
  const cutoff = subDays(new Date(), 2).toISOString();
  await supabase.from("bookings").delete().eq("status", "unconfirmed").lt("startDate", cutoff);

  // ... rest of the existing query
}
```

Then **after the search block**, add the 90-day archival filter:

```js
const applyArchivalFilter =
  filter && filter.field === "status" && filter.value !== "checked-out";

if (applyArchivalFilter) {
  const ninetyDaysAgo = subDays(new Date(), 90).toISOString();
  query = query.or(`status.neq.checked-out,checkOutAt.gte.${ninetyDaysAgo}`);
}
```

### 2.2 `src/features/restaurant/useRestaurantBookings.js` — New hook

Create a new custom hook following the same pattern as `useBookings.js`:

```js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookings } from "../../services/apiBookings";
import { useSearchParams } from "react-router";
import { PAGE_SIZE } from "../../utils/constants";

export function useRestaurantBookings() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const filter = { field: "status", value: "checked-in" };

  const sortByRaw = searchParams.get("sortBy") || "startDate-desc";
  const [field, direction] = sortByRaw.split("-");
  const sortBy = { field, direction };

  const page = !searchParams.get("page") ? 1 : Number(searchParams.get("page"));

  const search = searchParams.get("search") || null;

  const { isLoading, data: { data: bookings, count } = {} } = useQuery({
    queryKey: ["restaurant-bookings", sortBy, page, search],
    queryFn: () => getBookings({ filter, sortBy, page, search }),
  });

  const pageCount = Math.ceil(count / PAGE_SIZE);
  if (page < pageCount)
    queryClient.prefetchQuery({
      queryKey: ["restaurant-bookings", sortBy, page + 1, search],
      queryFn: () => getBookings({ filter, sortBy, page: page + 1, search }),
    });
  if (page > 1) {
    queryClient.prefetchQuery({
      queryKey: ["restaurant-bookings", sortBy, page - 1, search],
      queryFn: () => getBookings({ filter, sortBy, page: page - 1, search }),
    });
  }

  return { isLoading, bookings, count };
}
```

### 2.3 `src/pages/Restaurant.jsx` — Add pagination, use new hook

**Replace** the direct `useQuery` + `getBookings` call with `useRestaurantBookings()`:

```jsx
// Remove: import { useQuery } from "@tanstack/react-query";
// Remove: import { getBookings } from "../services/apiBookings";
import { useRestaurantBookings } from "../features/restaurant/useRestaurantBookings";

// In component:
const { isLoading, bookings, count } = useRestaurantBookings();
```

**Remove** the `getBookings` import and the inline `useQuery` call.

**Add** `<Pagination>` from `../../ui/Pagination` inside the table footer:

```jsx
import Pagination from "../ui/Pagination";

<StyledTable>
  <TableHeader>...</TableHeader>
  <Menus>
    {displayBookings.map(...)}
  </Menus>
</StyledTable>
<Pagination count={count} />
```

**Important:** The current search is client-side on the loaded page only. If the user searches "emma" but "emma" is on page 3, they won't find her on page 1. Keep this behavior simple for now — the search scopes to the current page's data.

---

## 3. Implementation Order

| Step | Action | File |
|------|--------|------|
| 1 | Add cleanup-on-read + 90-day `.or()` filter in `getBookings()` | `src/services/apiBookings.js` |
| 2 | Create `useRestaurantBookings` hook | `src/features/restaurant/useRestaurantBookings.js` |
| 3 | Update `Restaurant.jsx` — use new hook + add `Pagination` | `src/pages/Restaurant.jsx` |

---

## 4. Edge Cases & Considerations

- **Explicit "checked-out" filter:** The 90-day filter is skipped when the explicit filter is "checked-out", allowing staff to view all checked-out bookings.
- **Explicit "unconfirmed" filter:** Not needed for hiding — unconfirmed bookings older than 48h are already deleted. All remaining unconfirmed bookings are visible.
- **Dashboard & Today Activity:** `getStaysTodayActivity()` and `getBookingsAfterDate()` are separate functions and NOT affected — they already limit by date.
- **Restaurant orders:** They are linked by `bookingId`. When the booking is deleted (old unconfirmed), its restaurant orders are also deleted (CASCADE). Unconfirmed bookings never have restaurant orders in practice, so this is a safety net.
- **Data recovery:** Checked-out bookings > 90 days still exist in the DB. A future "Show archived" toggle can retrieve them. Unconfirmed deletions are irreversible — considered safe because they represent abandoned reservations.
- **UI auto-sync:** React Query refetches data on page navigation/mount, so the UI always shows the current state without manual refresh.

---

## 5. Visual Summary

```
Before:
  Bookings route → shows ALL bookings forever (w/ pagination)
  Restaurant route → loads ALL checked-in at once (no pagination)

After:
  Bookings route → hides checked-out > 90 days (w/ pagination)
  Restaurant route → paginated, hides checked-out > 90 days
  Unconfirmed > 48 hours → deleted on next read
```

---

## Appendix: Future Enhancement — pg_cron Scheduled Cleanup

If the hotel grows and "cleanup on read" becomes insufficient, a scheduled cron job can be added.

### Why upgrade?
- Deletes happen predictably every hour, not dependent on user activity
- More efficient — single DELETE per hour instead of one per API call
- Better for very large tables with millions of rows

### Setup

Create a new SQL migration `supabase/migrations/cleanup_unconfirmed_cron.sql`:

```sql
-- Enable pg_cron extension (already enabled in Supabase by default)
-- SELECT cron.schedule(
--     'delete-stale-unconfirmed',
--     '0 * * * *',  -- every hour
--     $$ DELETE FROM bookings WHERE status = 'unconfirmed' AND "startDate" < NOW() - INTERVAL '48 hours' $$
-- );

-- To remove:
-- SELECT cron.unschedule('delete-stale-unconfirmed');
```

### When upgrading
1. Uncomment and run the SQL above in Supabase SQL editor or add as a migration
2. Remove the cleanup-on-read lines from `getBookings()` in `apiBookings.js`
