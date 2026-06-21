import { differenceInDays, parseISO, subDays } from "date-fns";
import { PAGE_SIZE } from "../utils/constants";
import { getToday } from "../utils/helpers";
import supabase from "./supabase";

export async function getBookings({ filter, sortBy, page, search }) {
  const cutoff = subDays(new Date(), 2).toISOString();
  await supabase.from("bookings").delete().eq("status", "unconfirmed").lt("startDate", cutoff);

  let query = supabase
    .from("bookings")
    .select(
      "id, created_at, startDate, endDate, numNights, numGuests, status, totalPrice, checkInAt, checkOutAt, cabinId, cabins(name), guests(fullName, email)",
      { count: "exact" },
    );

  // if(filter !== null) query = query.eq(filter.field, filter.value)
  if (filter) query = query[filter.method || "eq"](filter.field, filter.value);

  if (search) {
    const { data: matchingGuests } = await supabase
      .from("guests")
      .select("id")
      .or(`fullName.ilike.%${search}%,email.ilike.%${search}%`);

    const { data: matchingCabins } = await supabase
      .from("cabins")
      .select("id")
      .or(`name.ilike.%${search}%`);

    const guestIds = matchingGuests?.map((g) => g.id) || [];
    const cabinIds = matchingCabins?.map((c) => c.id) || [];

    const filters = [];
    if (!isNaN(Number(search))) {
      filters.push(`id.eq.${Number(search)}`);
    }
    if (guestIds.length > 0) {
      filters.push(`guestId.in.(${guestIds.join(",")})`);
    }
    if (cabinIds.length > 0) {
      filters.push(`cabinId.in.(${cabinIds.join(",")})`);
    }

    query = query.or(filters.length > 0 ? filters.join(",") : "id.eq.0");
  }

  const applyArchivalFilter =
    filter && filter.field === "status" && filter.value !== "checked-out";

  if (applyArchivalFilter) {
    const ninetyDaysAgo = subDays(new Date(), 90).toISOString();
    query = query.or(`status.neq.checked-out,checkOutAt.gte.${ninetyDaysAgo}`);
  }

  if (sortBy)
    query = query.order(sortBy.field, {
      ascending: sortBy.direction === "asc",
    });

  // the pages will be reusable for all the tables, so we can just add the page parameter to the query and it will work for all the tables that use pagination. The prev page will be in cache, so it will be instant, and the next page will be fetched when the user clicks on the next button. This way we don't need to fetch all the data at once, which can be a problem if we have a lot of data.
  if (page) {
    const from = (page - 1) * PAGE_SIZE; // 0 * 10 = 0, 1 * 10 = 10, 2 * 10 = 20
    const to = from + PAGE_SIZE - 1; // 0 + 10 - 1 = 9, 10 + 10 - 1 = 19, 20 + 10 - 1 = 29
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }

  return { data, count };
}

export async function getBooking(id) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, cabins(*), guests(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking not found");
  }

  return data;
}

// Returns all BOOKINGS that are were created after the given date. Useful to get bookings created in the last 30 days, for example.
// date needs to be an ISO string
export async function getBookingsAfterDate(date) {
  const { data, error } = await supabase
    .from("bookings")
    .select("created_at, totalPrice, extrasPrice")
    .gte("created_at", date)
    .lte("created_at", getToday({ end: true }));

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }

  return data;
}

// Returns all STAYS that are were created after the given date
export async function getStaysAfterDate(date) {
  const { data, error } = await supabase
    .from("bookings")
    // .select('*')
    .select("*, guests(fullName)")
    .gte("startDate", date)
    .lte("startDate", getToday());

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }

  return data;
}

// Activity means that there is a check in or a check out today
export async function getStaysTodayActivity() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, guests(fullName, nationality, countryFlag)")
    .or(
      `and(status.eq.unconfirmed,startDate.eq.${getToday()}),and(status.eq.checked-in,endDate.eq.${getToday()})`,
    )
    .order("created_at");

  // Equivalent to this. But by querying this, we only download the data we actually need, otherwise we would need ALL bookings ever created
  // (stay.status === 'unconfirmed' && isToday(new Date(stay.startDate))) ||
  // (stay.status === 'checked-in' && isToday(new Date(stay.endDate)))

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }
  return data;
}

export async function updateBooking(id, obj) {
  const { data, error } = await supabase
    .from("bookings")
    .update(obj)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be updated");
  }
  return data;
}

export async function createUpdateBooking(newBooking, id) {
  let guestId;

  if (newBooking.guestName && newBooking.guestEmail) {
    const { data: existingGuest } = await supabase
      .from("guests")
      .select("id")
      .eq("email", newBooking.guestEmail)
      .maybeSingle();

    if (existingGuest) {
      guestId = existingGuest.id; //if the guest already exists, we use the existing guest id, otherwise we create a new guest and use the new guest id. This way we avoid creating duplicate guests with the same email.
    } else {
      const { data: createdGuest, error: guestError } = await supabase
        .from("guests")
        .insert([
          { fullName: newBooking.guestName, email: newBooking.guestEmail },
        ])
        .select("id")
        .single();

      if (guestError) throw new Error("Guest could not be created");
      guestId = createdGuest.id;
    }
  }

  const bookingForDb = { ...newBooking, guestId };
  delete bookingForDb.guestName; // we don't want to store the guest name in the bookings table, we only want to store the guest id, and we can get the guest name from the guests table when we need it. This way we avoid data duplication and potential inconsistencies.
  delete bookingForDb.guestEmail; // same for guest email too.

  const { data: cabin } = await supabase
    .from("cabins")
    .select("regularPrice, discount")
    .eq("id", bookingForDb.cabinId)
    .single();

  const numNights = differenceInDays(
    parseISO(bookingForDb.endDate),
    parseISO(bookingForDb.startDate),
  );

  const cabinPrice = numNights * (cabin.regularPrice - cabin.discount);

  const { data: settings } = await supabase
    .from("settings")
    .select("breakfastPrice")
    .single();

  // const extrasPrice = bookingForDb.hasBreakfast
  //   ? numNights * settings.breakfastPrice * bookingForDb.numGuests
  //   : 0;

  const extrasPrice = bookingForDb.numBreakfast
    ? bookingForDb.numBreakfast * settings.breakfastPrice
    : 0;

  const totalPrice =
    cabinPrice + extrasPrice + Number(bookingForDb.miscellaneousPrice || 0);

  const bookingData = {
    ...bookingForDb,
    numNights,
    cabinPrice,
    extrasPrice,
    totalPrice,
  };

  let query = supabase.from("bookings");

  if (!id) query = query.insert([bookingData]);
  if (id) query = query.update(bookingData).eq("id", id);

  const { data, error } = await query.select().single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be saved");
  }

  return data;
}

export async function deleteBooking(id) {
  // REMEMBER RLS POLICIES
  const { data, error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Booking could not be deleted");
  }
  return data;
}
