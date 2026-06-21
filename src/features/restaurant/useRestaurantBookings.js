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
