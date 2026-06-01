import { useForm } from "react-hook-form";
import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import FormRow from "../../ui/FormRow";
import Checkbox from "../../ui/Checkbox";
import { useCreateBooking } from "./useCreateBooking";
import { useEditBooking } from "./useEditBooking";
import { useCabins } from "../cabins/useCabins";

function CreateBookingForm({ bookingToEdit = {}, onCloseModal }) {
  const { createBooking, isCreating } = useCreateBooking();
  const { editBooking, isEditing } = useEditBooking();
  const { cabins } = useCabins();
  const isWorking = isCreating || isEditing;

  const { id: editId, guests: editGuests, ...editValues } = bookingToEdit;
  const isEditSession = Boolean(editId);

  const { register, handleSubmit, reset, formState, watch, setValue } = useForm({
    defaultValues: isEditSession
      ? {
          ...editValues,
          startDate: editValues.startDate?.split("T")[0] || "",
          endDate: editValues.endDate?.split("T")[0] || "",
          guestName: editGuests?.fullName || "",
          guestEmail: editGuests?.email || "",
        }
      : { status: "unconfirmed", hasBreakfast: false, isPaid: false },
  });
  const { errors } = formState;

  const hasBreakfast = watch("hasBreakfast");
  const isPaid = watch("isPaid");
  const cabinId = watch("cabinId");
  const selectedCabin = cabins?.find(c => c.id === Number(cabinId));
  const maxCapacity = selectedCabin?.maxCapacity || 999;

  function onSubmit(data) {
    const bookingData = {
      startDate: data.startDate,
      endDate: data.endDate,
      cabinId: Number(data.cabinId),
      numGuests: Number(data.numGuests),
      hasBreakfast: !!hasBreakfast,
      isPaid: !!isPaid, //!! means when isPaid is true, it will be true, when isPaid is false, it will be false. This is to ensure that the value is always a boolean. 
      status: data.status,
      observations: data.observations,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
    };

    if (isEditSession) {
      editBooking(
        { newBookingData: bookingData, id: editId },
        { onSuccess: () => { reset(); onCloseModal?.(); } },
      );
    } else {
      createBooking(
        bookingData,
        { onSuccess: () => { reset(); onCloseModal?.(); } },
      );
    }
  }

  function onError(errors) {
    console.log(errors);
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit, onError)} type={onCloseModal ? "modal" : "regular"}>
      <FormRow label="Start date" error={errors?.startDate?.message}>
        <Input type="date" id="startDate" disabled={isWorking}
          {...register("startDate", { required: "This field is required" })} />
      </FormRow>

      <FormRow label="End date" error={errors?.endDate?.message}>
        <Input type="date" id="endDate" disabled={isWorking}
          {...register("endDate", { required: "This field is required" })} />
      </FormRow>

      <FormRow label="Number of guests" error={errors?.numGuests?.message}>
        <Input type="number" id="numGuests" disabled={isWorking} min={1}
          {...register("numGuests", {
            required: "This field is required",
            min: { value: 1, message: "At least 1 guest" },
            validate: (value) =>
              Number(value) <= maxCapacity || `Max ${maxCapacity} guests for this cabin`,
          })} />
      </FormRow>

      <FormRow label="Cabin" error={errors?.cabinId?.message}>
        <select id="cabinId" disabled={isWorking}
          style={{
            fontSize: "1.4rem", padding: "0.8rem 1.2rem",
            border: "1px solid var(--color-grey-300)", borderRadius: "var(--border-radius-sm)",
            backgroundColor: "var(--color-grey-0)", fontWeight: 500, boxShadow: "var(--shadow-sm)",
          }}
          {...register("cabinId", { required: "This field is required" })}>
          <option value="">Select a cabin...</option>
          {cabins?.map(cabin => (
            <option key={cabin.id} value={cabin.id}>{cabin.name}</option>
          ))}
        </select>
      </FormRow>

      <FormRow label="Guest name" error={errors?.guestName?.message}>
        <Input type="text" id="guestName" disabled={isWorking}
          {...register("guestName", { required: "This field is required" })} />
      </FormRow>

      <FormRow label="Guest email" error={errors?.guestEmail?.message}>
        <Input type="email" id="guestEmail" disabled={isWorking}
          {...register("guestEmail", { required: "This field is required" })} />
      </FormRow>

      <FormRow label="Status" error={errors?.status?.message}>
        <select id="status" disabled={isWorking}
          style={{
            fontSize: "1.4rem", padding: "0.8rem 1.2rem",
            border: "1px solid var(--color-grey-300)", borderRadius: "var(--border-radius-sm)",
            backgroundColor: "var(--color-grey-0)", fontWeight: 500, boxShadow: "var(--shadow-sm)",
          }}
          {...register("status", { required: "This field is required" })}>
          <option value="unconfirmed">Unconfirmed</option>
          <option value="checked-in">Checked in</option>
          <option value="checked-out">Checked out</option>
        </select>
      </FormRow>

      <FormRow label="Observations" error={errors?.observations?.message}>
        <Textarea id="observations" disabled={isWorking}
          {...register("observations")} />
      </FormRow>

      <FormRow>
        <Checkbox checked={hasBreakfast} onChange={() => setValue("hasBreakfast", !hasBreakfast)} id="hasBreakfast" disabled={isWorking}>
          Breakfast included?
        </Checkbox>
      </FormRow>

      <FormRow>
        <Checkbox checked={isPaid} onChange={() => setValue("isPaid", !isPaid)} id="isPaid" disabled={isWorking}>
          Payment received
        </Checkbox>
      </FormRow>

      <FormRow>
        <Button variation="secondary" type="reset" disabled={isWorking} onClick={() => onCloseModal?.()}>
          Cancel
        </Button>
        <Button disabled={isWorking}>
          {isEditSession ? "Edit booking" : "Create new booking"}
        </Button>
      </FormRow>
    </Form>
  );
}

export default CreateBookingForm;
