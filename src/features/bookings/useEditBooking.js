import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUpdateBooking } from "../../services/apiBookings";
import toast from "react-hot-toast";

export function useEditBooking() {
  const queryClient = useQueryClient();

  const { mutate: editBooking, isPending: isEditing } = useMutation({
    mutationFn: ({ newBookingData, id }) => createUpdateBooking(newBookingData, id),
    onSuccess: (data) => {
      toast.success("Booking successfully edited");
      queryClient.setQueryData(["bookings", data.id], data); //update the booking details without refetching, from stale to fresh with the new data
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { editBooking, isEditing };
}
