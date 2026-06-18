import { useForm } from "react-hook-form";
import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import { useCreateRestaurantOrder } from "./useCreateRestaurantOrder";

function CreateRestaurantOrderForm({ bookingId, onCloseModal }) {
  const { createOrder, isCreating } = useCreateRestaurantOrder();
  const { register, handleSubmit, reset, formState } = useForm();
  const { errors } = formState;

  function onSubmit(data) {
    createOrder(
      {
        bookingId,
        itemName: data.itemName,
        quantity: Number(data.quantity),
        unitPrice: Number(data.unitPrice),
      },
      {
        onSuccess: () => {
          reset();
          onCloseModal?.();
        },
      },
    );
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      type={onCloseModal ? "modal" : "regular"}
    >
      <FormRow label="Item name" error={errors?.itemName?.message}>
        <Input
          type="text"
          id="itemName"
          disabled={isCreating}
          {...register("itemName", { required: "This field is required" })}
        />
      </FormRow>

      <FormRow label="Quantity" error={errors?.quantity?.message}>
        <Input
          type="number"
          id="quantity"
          disabled={isCreating}
          defaultValue={1}
          {...register("quantity", {
            required: "This field is required",
            min: { value: 1, message: "Minimum quantity is 1" },
          })}
        />
      </FormRow>

      <FormRow label="Unit price ($)" error={errors?.unitPrice?.message}>
        <Input
          type="number"
          id="unitPrice"
          disabled={isCreating}
          step="0.01"
          {...register("unitPrice", {
            required: "This field is required",
            min: { value: 0, message: "Price cannot be negative" },
          })}
        />
      </FormRow>

      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          disabled={isCreating}
          onClick={() => onCloseModal?.()}
        >
          Cancel
        </Button>
        <Button disabled={isCreating}>Add to bill</Button>
      </FormRow>
    </Form>
  );
}

export default CreateRestaurantOrderForm;
