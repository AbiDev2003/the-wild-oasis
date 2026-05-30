import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookings } from "../../services/apiBookings";
import { useSearchParams } from "react-router";
import {PAGE_SIZE} from './../../utils/constants';
export function useBookings() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // filter
  const filterValue = searchParams.get("status");
  const filter =
    !filterValue || filterValue === "all"
      ? null
      : { field: "status", value: filterValue };
  // : { field: "totalPrice", value: 5000, method: 'gte' };

  const sortByRaw = searchParams.get("sortBy") || "startDate-desc";
  const [field, direction] = sortByRaw.split("-");
  const sortBy = { field, direction };

  // pagination
  const page = !searchParams.get("page") ? 1 : Number(searchParams.get("page"));

  const {
    isLoading,
    data: { data: bookings, count } = {},
    // error,
  } = useQuery({
    queryKey: ["bookings", filter, sortBy, page], //this is like a dependancy array, it is used to cache the data and to refetch the data when the queryKey changes
    queryFn: () => getBookings({ filter, sortBy, page }),
  });

  // PRE-FETCHING: we can pre-fetch the next page of bookings when the user is on the current page, so that when the user clicks on the next button, the data is already in the cache and it will be instant. This is a great way to improve the user experience and to make the app feel faster. We can use the useQueryClient hook to get the query client and then we can use the prefetchQuery method to pre-fetch the next page of bookings.

  const pageCount = Math.ceil(count / PAGE_SIZE);
  // for next page
  if (page < pageCount)
    queryClient.prefetchQuery({
      queryKey: ["bookings", filter, sortBy, page + 1],
      queryFn: () => getBookings({ filter, sortBy, page: page + 1 }),
    });

  // for previous page
  if (page > 1) {
    queryClient.prefetchQuery({
      queryKey: ["bookings", filter, sortBy, page - 1],
      queryFn: () => getBookings({ filter, sortBy, page: page - 1 }),
    });
  }
  return { isLoading, bookings, count };
}
