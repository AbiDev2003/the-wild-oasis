import styled from "styled-components";
import BookingDataBox from "../../features/bookings/BookingDataBox";

import Row from "../../ui/Row";
import Heading from "../../ui/Heading";
import ButtonGroup from "../../ui/ButtonGroup";
import Button from "../../ui/Button";
import ButtonText from "../../ui/ButtonText";
import Input from "../../ui/Input";

import { useMoveBack } from "../../hooks/useMoveBack";
import { useBooking } from "../bookings/useBooking";
import Spinner from "../../ui/Spinner";
import { useRef, useState } from "react";
import Checkbox from "./../../ui/Checkbox.jsx";
import { formatCurrency } from "../../utils/helpers.js";
import { useCheckin } from "./useCheckin.js";
import { useSettings } from "../settings/useSettings.js";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import DataItem from "./../../ui/DataItem";

const Box = styled.div`
  /* Box */
  background-color: var(--color-grey-0);
  border: 1px solid var(--color-grey-100);
  border-radius: var(--border-radius-md);
  padding: 2.4rem 4rem;
`;

function CheckinBooking() {
  const [confirmPaid, setConfirmPaid] = useState(false);
  const { booking, isLoading } = useBooking();
  const [numOfBreakfast, setNumOfBreakfast] = useState(0);
  const { settings, isPending: isLoadingSettings } = useSettings();

  const prevBookingId = useRef(booking?.id);

  if (prevBookingId.current !== booking?.id) {
    prevBookingId.current = booking?.id;
    setConfirmPaid(booking?.isPaid ?? false);
    // Sync numBreakfast from booking (support old hasBreakfast fallback for migration)
    const val = booking?.numBreakfast ?? (booking?.hasBreakfast ? booking.numNights * booking.numGuests : 0);
    setNumOfBreakfast(val);
  }

  const moveBack = useMoveBack();
  const { checkin, isCheckingIn } = useCheckin();
  const [miscPrice, setMiscPrice] = useState(0);

  if (isLoading || isLoadingSettings) return <Spinner />;

  const {
    id: bookingId,
    guests,
    // totalPrice,
    // numGuests,
    // hasBreakfast,
    // numNights,
    cabinPrice,
    // numBreakfast: existingNumBreakfast,
    miscellaneousPrice: existingMiscPrice,
  } = booking;

  const breakfastCost = numOfBreakfast * settings.breakfastPrice;
  const miscTotal = miscPrice > 0 ? miscPrice : (existingMiscPrice || 0);
  const newTotalPrice = cabinPrice + breakfastCost + miscTotal;

  function handleCheckin() {
    if (!confirmPaid) return;

    const updates = {
      numBreakfast: numOfBreakfast,
      hasBreakfast: numOfBreakfast > 0,
      extrasPrice: breakfastCost,
      totalPrice: newTotalPrice,
    };

    if (miscPrice > 0) {
      updates.miscellaneousPrice = miscPrice;
    }

    checkin({ bookingId, ...updates });
  }
  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">Check in booking #{bookingId}</Heading>
        <ButtonText onClick={moveBack}>&larr; Back</ButtonText>
      </Row>

      <BookingDataBox booking={booking} />

      <Box>
        <DataItem icon={<HiOutlineCurrencyDollar />} label="Number of breakfasts">
          <Input
            type="number"
            placeholder="0"
            value={numOfBreakfast}
            onChange={(e) => {
              setNumOfBreakfast(parseInt(e.target.value) || 0);
              setConfirmPaid(false);
            }}
            min="0"
            step="1"
          />
        </DataItem>
      </Box>

      <Box>
        <DataItem
          icon={<HiOutlineCurrencyDollar />}
          label="Additional miscellaneous price"
        >
          <Input
            type="number"
            placeholder="0"
            value={miscPrice}
            onChange={(e) => setMiscPrice(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </DataItem>
      </Box>

      <Box>
        <Checkbox
          checked={confirmPaid}
          disabled={confirmPaid || isCheckingIn}
          onChange={() => setConfirmPaid((confirm) => !confirm)}
        >
          I confirm that {guests.fullName} has paid the total amount of{" "}
          {formatCurrency(newTotalPrice)}
          {` (${formatCurrency(cabinPrice)} cabin`}
          {numOfBreakfast > 0 ? ` + ${formatCurrency(breakfastCost)} breakfast` : ""}
          {miscTotal > 0 ? ` + ${formatCurrency(miscTotal)} misc.` : ""})
        </Checkbox>
      </Box>

      <ButtonGroup>
        <Button onClick={handleCheckin} disabled={!confirmPaid || isCheckingIn}>
          Check in booking #{bookingId}
        </Button>
        <Button variation="secondary" onClick={moveBack}>
          Back
        </Button>
      </ButtonGroup>
    </>
  );
}

export default CheckinBooking;
