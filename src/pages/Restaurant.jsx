import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { useNavigate } from "react-router";
import { HiEye, HiArrowUpOnSquare } from "react-icons/hi2";
import { getBookings } from "../services/apiBookings";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import Spinner from "../ui/Spinner";
import Empty from "../ui/Empty";
import Menus from "../ui/Menus";
import RestaurantOrderBox from "../features/restaurant/RestaurantOrderBox";
import { useCheckout } from "../features/check-in-out/useCheckout";

const StyledTable = styled.div`
  border: 1px solid var(--color-grey-200);
  font-size: 1.4rem;
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-md);
  overflow: hidden;
`;

const TableHeader = styled.header`
  display: grid;
  grid-template-columns: 1.5fr 1fr 2.5fr 1fr;
  column-gap: 2.4rem;
  align-items: center;

  background-color: var(--color-grey-50);
  border-bottom: 1px solid var(--color-grey-100);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
  color: var(--color-grey-600);
  padding: 1.6rem 2.4rem;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 2.5fr 1fr;
  column-gap: 2.4rem;
  align-items: center;
  padding: 1.6rem 2.4rem;

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-grey-100);
  }
`;

function Restaurant() {
  const navigate = useNavigate();
  const { checkout } = useCheckout();

  const { isLoading, data: { data: bookings } = {} } = useQuery({
    queryKey: ["bookings", "checked-in"],
    queryFn: () => getBookings({ filter: { field: "status", value: "checked-in" } }),
  });

  if (isLoading) return <Spinner />;
  if (!bookings?.length) return <Empty resourceName="checked-in bookings" />;

  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">Restaurant Orders</Heading>
      </Row>

      <StyledTable>
        <TableHeader>
          <div>Guest</div>
          <div>Cabin</div>
          <div>Action</div>
          <div></div>
        </TableHeader>

        <Menus>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <div>{booking.guests?.fullName}</div>
              <div>{booking.cabins?.name}</div>
              <div>
                <RestaurantOrderBox bookingId={booking.id} compact />
              </div>
              <div>
                <Menus.Menu>
                  <Menus.Toggle id={booking.id} />
                  <Menus.List id={booking.id}>
                    <Menus.Button
                      icon={<HiEye />}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      See details
                    </Menus.Button>
                    <Menus.Button
                      icon={<HiArrowUpOnSquare />}
                      onClick={() => checkout(booking.id)}
                    >
                      Check out
                    </Menus.Button>
                  </Menus.List>
                </Menus.Menu>
              </div>
            </TableRow>
          ))}
        </Menus>
      </StyledTable>
    </>
  );
}

export default Restaurant;
