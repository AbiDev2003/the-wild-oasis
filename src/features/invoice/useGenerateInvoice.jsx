import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { getBooking } from "../../services/apiBookings";
import { getRestaurantOrders } from "../../services/apiRestaurant";
import QRCode from "qrcode";
import InvoicePDF from "./InvoicePDF";

export function useGenerateInvoice() {
  const [isLoading, setIsLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [error, setError] = useState(null);

  async function generatePdf(bookingId) {
    setIsLoading(true);
    setError(null);
    setPdfBlob(null);

    try {
      const booking = await getBooking(bookingId);
      const orders = await getRestaurantOrders(bookingId);

      const verificationUrl = `https://the-wild-oasis.com/verify-invoice?bookingId=${bookingId}`;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 240,
        margin: 2,
      });

      const blob = await pdf(
        <InvoicePDF
          booking={booking}
          orders={orders ?? []}
          qrDataUrl={qrDataUrl}
        />,
      ).toBlob();

      setPdfBlob(blob);
      return { pdfBlob: blob, booking };
    } catch (err) {
      console.error("Failed to generate invoice PDF:", err);
      setError(err.message || "Failed to generate invoice");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, generatePdf, pdfBlob, error };
}
