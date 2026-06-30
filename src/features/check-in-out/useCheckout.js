import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBooking } from "../../services/apiBookings";
import toast from "react-hot-toast";
import { useGenerateInvoice } from "./../invoice/useGenerateInvoice";
import { sendInvoiceEmail } from "../invoice/sendInvoiceEmail";

export function useCheckout() {
  const queryClient = useQueryClient();
  const { generatePdf } = useGenerateInvoice();

  const { mutate: checkout, isPending: isCheckingOut } = useMutation({
    mutationFn: (bookingId) =>
      updateBooking(bookingId, {
        status: "checked-out",
        checkOutAt: new Date().toISOString(),
      }),
    onSuccess: async (data) => {
      toast.success(`Booking #${data.id} successfully checked out`);

      try {
        const { pdfBlob, booking } = await generatePdf(data.id);
        await sendInvoiceEmail(data.id, pdfBlob, booking?.guests?.email);
      } catch (err) {
        console.error("Invoice email/PDF failed:", err);
        toast.error("Invoice email failed to send");
      }

      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => {
      toast.error(`There was an error while checking out`);
    },
  });

  return { checkout, isCheckingOut };
}
