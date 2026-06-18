import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRestaurantOrder } from "../../services/apiRestaurant";
import toast from "react-hot-toast";

export function useCreateRestaurantOrder() {
  const queryClient = useQueryClient();

  const { mutate: createOrder, isPending: isCreating } = useMutation({
    mutationFn: createRestaurantOrder,
    onSuccess: () => {
      toast.success("Order added to bill");
      queryClient.invalidateQueries({ queryKey: ["restaurantorders"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => {
      console.error("🚨 Mutation onError:", err);
      toast.error(err.message);
    },
  });

  return { createOrder, isCreating };
}
