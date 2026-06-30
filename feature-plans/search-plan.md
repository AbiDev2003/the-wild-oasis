# Search Feature Implementation Plan

## Overview

Add a search bar to the **Bookings**, **Cabins**, and **Restaurant** routes so users can find records by ID, name, or other fields. The search bar follows the existing URL-param pattern used by `Filter`, `SortBy`, and `Pagination`.

---

## 1. Shared UI Component: `SearchBar`

**File to create:** `src/ui/SearchBar.jsx`

A reusable styled search `<input>` that:
- Reads/writes a `?search=` URL search param (via `useSearchParams`)
- Has a **debounce** (~400ms) so queries aren't fired on every keystroke
- Renders a magnifying glass icon inside the input (from `react-icons/hi2`, `HiMagnifyingGlass`)
- Clears the `page` param to 1 when the search value changes (to avoid empty pages)
- Shows a small "×" clear button when text is present
- Is placed inside `<TableOperations>` alongside `<Filter>` and `<SortBy>`

**Props:** `placeholder` (string), optional `filterField` default `"search"`, optional `$width` (string, e.g. `"40rem"`)

---

## 2. Bookings Route — Server-Side Search

**Approach:** Server-side to scale with large data volumes.

**Searchable fields:** booking ID, guest name, guest email, cabin name

### 2.1 Update `apiBookings.js`

**File:** `src/services/apiBookings.js`

**Change:** Extend `getBookings({ filter, sortBy, page })` to accept `search`.

When `search` is provided, query the `guests` table and `cabins` table for matches, then build an `.or()` filter across:
- `id.eq.` (booking ID, if numeric)
- `guestId.in.` (matching guest IDs from guests table)
- `cabinId.in.` (matching cabin IDs from cabins table)

The `.or()` should be combined with the existing `filter` (status) using `.eq()` — keep them as separate chained filters.

### 2.2 Update `useBookings.js`

**File:** `src/features/bookings/useBookings.js`

**Changes:**
- Read `?search=` from URL params
- Pass the `search` value to `getBookings()` as a 4th argument
- Add `search` to the query key: `["bookings", filter, sortBy, page, search]`
- Update `prefetchQuery` calls to also include `search`

### 2.3 Update `Bookings.jsx`

**File:** `src/pages/Bookings.jsx`

**Change:** Import `<SearchBar>` and add it alongside `<AddBooking>` in a new row above `<BookingTable>`. The SearchBar sits on the left, AddBooking on the right.

---

## 3. Cabins Route — Client-Side Search

**Approach:** Client-side — cabins data is always small, even in production.

**Searchable fields:** cabin name

### 3.1 Update `CabinTable.jsx`

**File:** `src/features/cabins/CabinTable.jsx`

**Changes:**
- Read `?search=` from URL params
- After the existing `discount` filter, apply a **search filter** that checks if `cabin.name` contains the search term (case-insensitive)
- If `search` is empty, skip the filter

### 3.2 Update `CabinTableOperations.jsx`

**File:** `src/features/cabins/CabinTableOperations.jsx`

**Change:** Import and add `<SearchBar placeholder="Search by cabin name..." />` as the first child inside `<TableOperations>`.

---

## 4. Restaurant Route — Client-Side Search

**Approach:** Client-side — only checked-in bookings are loaded, naturally small subset.

**Searchable fields:** booking ID, guest name, guest email, cabin name

### 4.1 Update `Restaurant.jsx`

**File:** `src/pages/Restaurant.jsx`

**Changes:**
- Add a `<Row type="horizontal">` section above the table with a `<SearchBar>` (wrapped in `<TableOperations>` for consistent spacing)
- Add a **Booking ID** column to the table header and rows (displays `booking.id`) so users can see and reference the booking number
- Read `?search=` from URL params via `useSearchParams`
- After fetching bookings, apply an in-memory filter when `search` is present:
  - `booking.id.toString()`
  - `booking.guests?.fullName`
  - `booking.guests?.email`
  - `booking.cabins?.name`

> **Note:** Order ID search is not included. Order IDs will be searchable as a follow-up if needed.
- If no `search`, show all checked-in bookings (current behavior)

---

## 5. Summary of File Changes

| Action | File |
|--------|------|
| **Create** | `src/ui/SearchBar.jsx` — shared search component with debounce + URL params |
| **Edit** | `src/services/apiBookings.js` — add `search` param, query `guests` and `cabins` tables, build `.or()` with `.eq()`/`.in()` filters |
| **Edit** | `src/features/bookings/useBookings.js` — read `?search`, pass to API, add to query keys |
| **Edit** | `src/pages/Bookings.jsx` — add `<SearchBar>` in a row with `<AddBooking>` |
| **Edit** | `src/features/cabins/CabinTable.jsx` — read `?search`, filter cabins in-memory |
| **Edit** | `src/features/cabins/CabinTableOperations.jsx` — add `<SearchBar>` |
| **Edit** | `src/pages/Restaurant.jsx` — add `<SearchBar>` + in-memory search filter |

---

## 6. Approach & Future-Proofing

| Route | Approach | Reason |
|-------|----------|--------|
| **Bookings** | Server-side (query `guests`/`cabins` tables, then `.or()`/`.eq()`/`.in()` filters) | Can scale to thousands of rows without performance loss |
| **Cabins** | Client-side (fetch all, filter in-memory) | Cabins are always a small set, even in large hotels |
| **Restaurant** | Client-side (fetch all checked-in, filter in-memory) | Only checked-in bookings — naturally a small subset |

---

## 7. Implementation Order (simplest → most complex)

1. **Create `src/ui/SearchBar.jsx`** — shared component used by all routes
2. **Cabins route** — client-side, easiest: `CabinTable.jsx` + `CabinTableOperations.jsx`
3. **Restaurant route** — client-side: `Restaurant.jsx` (Booking ID column already added)
4. **Bookings route** — server-side, trickiest: `apiBookings.js` + `useBookings.js` + `BookingTableOperations.jsx`
5. Manual testing on all three routes
