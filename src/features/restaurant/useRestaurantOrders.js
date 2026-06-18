import { useQuery } from "@tanstack/react-query";
import { getRestaurantOrders } from "../../services/apiRestaurant";

export function useRestaurantOrders(bookingId) {
  const { isLoading, data: restaurantOrders } = useQuery({
    queryKey: ["restaurantorders", bookingId],
    queryFn: () => getRestaurantOrders(bookingId),
    enabled: !!bookingId,
  });

  return { isLoading, restaurantOrders };
}
