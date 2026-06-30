import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUpdateBooking } from "../../services/apiBookings";
import toast from "react-hot-toast";
import { sendEmail } from "../../services/emailService";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  const { mutate: createBooking, isPending: isCreating } = useMutation({
    mutationFn: (data) => createUpdateBooking(data),
    onSuccess: (data) => {
      toast.success("New booking successfully created");
      sendEmail(data.id, "booking-confirmation");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { createBooking, isCreating };
}
