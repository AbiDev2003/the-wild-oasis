import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBooking } from "../../services/apiBookings";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { sendEmail } from "../../services/emailService";

export function useCheckin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: checkin, isPending: isCheckingIn } = useMutation({
    mutationFn: ({ bookingId, breakfast, ...extra }) =>
      updateBooking(bookingId, {
        status: "checked-in",
        isPaid: true,
        checkInAt: new Date().toISOString(),
        ...breakfast,
        ...extra,
      }),
    onSuccess: (data) => {
      toast.success(`Booking #${data.id} successfully checked in`);
      sendEmail(data.id, "check-in");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate("/");
    },
    onError: () => {
      toast.error(`There was an error while checking in`);
    },
  });

  return { checkin, isCheckingIn };
}
