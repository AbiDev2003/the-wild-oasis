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
  const [addBreakfast, setAddBreakfast] = useState();
  const { settings, isPending: isLoadingSettings } = useSettings();

  // Before (ESLint error - react-hooks/set-state-in-effect):
  // useEffect(() => setConfirmPaid(booking?.isPaid ?? false), [booking]);
  // After: Sync state during render instead of in an effect to avoid cascading renders.
  const prevBookingId = useRef(booking?.id);

  if (prevBookingId.current !== booking?.id) {
    prevBookingId.current = booking?.id;
    setConfirmPaid(booking?.isPaid ?? false);
  }

  const moveBack = useMoveBack();
  const { checkin, isCheckingIn } = useCheckin();
  const [miscPrice, setMiscPrice] = useState(0);

  if (isLoading || isLoadingSettings) return <Spinner />;

  const {
    id: bookingId,
    guests,
    totalPrice,
    numGuests,
    hasBreakfast,
    numNights,
  } = booking;

  const optionalBreakfastPrice =
    settings.breakfastPrice * numNights * numGuests;

  function handleCheckin() {
    if (!confirmPaid) return;

    let newTotalPrice = totalPrice;
    const breakfast = {};

    if (addBreakfast) {
      breakfast.hasBreakfast = true;
      breakfast.extrasPrice = optionalBreakfastPrice;
      newTotalPrice += optionalBreakfastPrice;
    }

    const extra = {};
    if (miscPrice > 0) {
      extra.miscellaneousPrice = miscPrice;
      newTotalPrice += miscPrice;
    }

    extra.totalPrice = newTotalPrice;

    checkin({ bookingId, breakfast, ...extra });
  }
  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">Check in booking #{bookingId}</Heading>
        <ButtonText onClick={moveBack}>&larr; Back</ButtonText>
      </Row>

      <BookingDataBox booking={booking} />

      {!hasBreakfast && (
        <Box>
          <Checkbox
            checked={addBreakfast}
            onChange={() => {
              setAddBreakfast((add) => !add);
              setConfirmPaid(false);
            }}
            id="breakfast"
          >
            Want to add breakfast for {formatCurrency(optionalBreakfastPrice)}?
          </Checkbox>
        </Box>
      )}

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
          {!addBreakfast && !miscPrice
            ? formatCurrency(totalPrice)
            : `${formatCurrency(totalPrice + (addBreakfast ? optionalBreakfastPrice : 0) + miscPrice)}${` (${formatCurrency(totalPrice)}`}${addBreakfast ? ` + ${formatCurrency(optionalBreakfastPrice)} breakfast` : ""}${miscPrice > 0 ? ` + ${formatCurrency(miscPrice)} misc.` : ""})`}
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
