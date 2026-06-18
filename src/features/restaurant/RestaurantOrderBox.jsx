import styled from "styled-components";
import Box from "../../ui/Box";
import DataItem from "../../ui/DataItem";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import CreateRestaurantOrderForm from "./CreateRestaurantOrderForm";
import { useRestaurantOrders } from "./useRestaurantOrders";
import { formatCurrency } from "../../utils/helpers";
import SpinnerMini from "./../../ui/SpinnerMini";

const StyledOrderList = styled.div`
  max-height: 24rem;
  overflow-y: auto;
  margin-top: 0.8rem;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-size: 1.3rem;
  border-bottom: 1px solid var(--color-grey-100);
`;

function RestaurantOrderBox({ bookingId, compact = false }) {
  const { isLoading, restaurantOrders } = useRestaurantOrders(bookingId);
  const orderCount = restaurantOrders?.length || 0;
  const restaurantTotal =
    restaurantOrders?.reduce((sum, o) => sum + (o.totalprice || 0), 0) || 0;

  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <DataItem
        icon={<HiOutlineCurrencyDollar />}
        label={compact ? "" : "Restaurant"}
      >
        {isLoading ? (
          <SpinnerMini />
        ) : orderCount > 0 ? (
          `${orderCount} item${orderCount > 1 ? "s" : ""} \u2014 ${formatCurrency(restaurantTotal)}`
        ) : (
          "No orders yet"
        )}
      </DataItem>

      <Modal>
        <Modal.Open opens="restaurant-orders">
          <Button size="small">
            {orderCount > 0 ? "View & add" : "+ Add bill"}
          </Button>
        </Modal.Open>
        <Modal.Window name="restaurant-orders">
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}
          >
            <CreateRestaurantOrderForm bookingId={bookingId} />

            {!isLoading && orderCount > 0 && (
              <div
                style={{
                  maxHeight: "40vh",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <p
                  style={{
                    fontWeight: 600,
                    borderTop: "1px solid var(--color-grey-200)",
                    paddingTop: "1.6rem",
                  }}
                >
                  Current orders
                </p>
                <StyledOrderList>
                  {restaurantOrders.map((order) => (
                    <OrderItem key={order.id}>
                      <span>
                        {order.itemname} x{order.quantity}
                      </span>
                      <span>{formatCurrency(order.totalprice)}</span>
                    </OrderItem>
                  ))}
                </StyledOrderList>
                <p style={{ fontWeight: 600, textAlign: "right" }}>
                  Total: {formatCurrency(restaurantTotal)}
                </p>
              </div>
            )}
          </div>
        </Modal.Window>
      </Modal>
    </div>
  );

  if (compact) return content;
  return <Box>{content}</Box>;
}

export default RestaurantOrderBox;
