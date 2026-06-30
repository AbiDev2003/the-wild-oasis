import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "../services/supabase";
import styled from "styled-components";
import Heading from "../ui/Heading";

const PageLayout = styled.main`
  min-height: 100vh;
  display: grid;
  align-content: center;
  justify-content: center;
  padding: 4rem 2rem;
  background-color: var(--color-grey-50);
`;

const Card = styled.div`
  background: var(--color-grey-0);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  padding: 3.2rem 4rem;
  max-width: 600px;
  width: 100%;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid var(--color-grey-100);
  font-size: 1.4rem;
`;

const Label = styled.span`
  color: var(--color-grey-500);
  font-weight: 500;
`;

const Value = styled.span`
  color: var(--color-grey-800);
  font-weight: 600;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.4rem 1.2rem;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  font-size: 1.2rem;
  background-color: ${(props) =>
    props.$paid ? "var(--color-green-100)" : "var(--color-yellow-100)"};
  color: ${(props) =>
    props.$paid ? "var(--color-green-700)" : "var(--color-yellow-700)"};
`;

const ErrorBox = styled.div`
  text-align: center;
  padding: 4rem;
  color: var(--color-grey-500);
`;

function VerifyInvoice() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) return;

    async function fetchBooking() {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, created_at, startDate, endDate, numNights, numGuests, cabinPrice, extrasPrice, totalPrice, miscellaneousPrice, isPaid, checkInAt, checkOutAt, cabins(name), guests(fullName)")
        .eq("id", bookingId)
        .single();

      if (error) {
        setError("Booking not found or access denied");
      } else {
        setBooking(data);
      }
      setLoading(false);
    }

    fetchBooking();
  }, [bookingId]);

  return (
    <PageLayout>
      <Card>
        {loading && bookingId && <p style={{ textAlign: "center" }}>Verifying invoice...</p>}

        {!bookingId && (
          <ErrorBox>
            <Heading as="h4">Invoice Verification</Heading>
            <p>No booking ID provided</p>
          </ErrorBox>
        )}

        {error && bookingId && (
          <ErrorBox>
            <Heading as="h4">Invoice Verification</Heading>
            <p>{error}</p>
            <p style={{ marginTop: "1rem", fontSize: "1.2rem", color: "var(--color-grey-400)" }}>
              Booking #{bookingId}
            </p>
          </ErrorBox>
        )}

        {booking && (
          <>
            <div style={{ textAlign: "center", marginBottom: "2.4rem" }}>
              <Heading as="h2">The Wild Oasis</Heading>
              <p style={{ color: "var(--color-grey-500)", fontSize: "1.2rem", letterSpacing: "2px" }}>
                INVOICE VERIFICATION
              </p>
              <p style={{ color: "var(--color-grey-400)", fontSize: "1.1rem", marginTop: "0.4rem" }}>
                Booking #{booking.id}
              </p>
            </div>

            <Row><Label>Guest</Label><Value>{booking.guests?.fullName}</Value></Row>
            <Row><Label>Cabin</Label><Value>{booking.cabins?.name}</Value></Row>
            <Row><Label>Check-in</Label><Value>{booking.startDate}</Value></Row>
            <Row><Label>Check-out</Label><Value>{booking.endDate}</Value></Row>
            <Row><Label>Nights</Label><Value>{booking.numNights}</Value></Row>
            <Row><Label>Guests</Label><Value>{booking.numGuests}</Value></Row>
            <Row><Label>Cabin Price</Label><Value>${(booking.cabinPrice ?? 0).toFixed(2)}</Value></Row>
            {booking.extrasPrice > 0 && (
              <Row><Label>Breakfast / Extras</Label><Value>${(booking.extrasPrice ?? 0).toFixed(2)}</Value></Row>
            )}
            {booking.miscellaneousPrice > 0 && (
              <Row><Label>Miscellaneous</Label><Value>${(booking.miscellaneousPrice ?? 0).toFixed(2)}</Value></Row>
            )}
            <Row style={{ borderTop: "2px solid var(--color-grey-800)", fontWeight: "bold", marginTop: "0.4rem" }}>
              <Label>TOTAL</Label>
              <Value>${(booking.totalPrice ?? 0).toFixed(2)}</Value>
            </Row>
            <Row>
              <Label>Payment Status</Label>
              <Value><StatusBadge $paid={booking.isPaid}>{booking.isPaid ? "PAID" : "WILL PAY AT PROPERTY"}</StatusBadge></Value>
            </Row>

            <p style={{ textAlign: "center", marginTop: "2.4rem", fontSize: "1.1rem", color: "var(--color-grey-400)" }}>
              This document serves as official invoice verification.
              <br />
              Scan the QR code on your PDF to return here.
            </p>
          </>
        )}
      </Card>
    </PageLayout>
  );
}

export default VerifyInvoice;
