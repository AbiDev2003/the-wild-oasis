import styled from "styled-components";
import { useNavigate, useSearchParams } from "react-router";
import { HiEye, HiArrowUpOnSquare } from "react-icons/hi2";
import { useCheckout } from "../features/check-in-out/useCheckout";
import { useRestaurantBookings } from "../features/restaurant/useRestaurantBookings";

import Heading from "../ui/Heading";
import Spinner from "../ui/Spinner";
import Empty from "../ui/Empty";
import Menus from "../ui/Menus";
import Pagination from "../ui/Pagination";
import RestaurantOrderBox from "../features/restaurant/RestaurantOrderBox";
import TableOperations from "./../ui/TableOperations";
import SearchBar from "../ui/SearchBar";

const StyledTable = styled.div`
  border: 1px solid var(--color-grey-200);
  font-size: 1.4rem;
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-md);
  overflow: hidden;

  @media (max-width: 600px) {
    border: none;
    background-color: transparent;
  }
`;

const TableHeader = styled.header`
  display: grid;
  grid-template-columns: 0.5fr 1.5fr 1fr 2.5fr 1fr;
  column-gap: 2.4rem;
  align-items: center;

  background-color: var(--color-grey-50);
  border-bottom: 1px solid var(--color-grey-100);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
  color: var(--color-grey-600);
  padding: 1.6rem 2.4rem;

  @media (max-width: 600px) {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1.5fr 1fr 2.5fr 1fr;
  column-gap: 2.4rem;
  align-items: center;
  padding: 1.6rem 2.4rem;

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-grey-100);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 0.4rem;
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    border: 1px solid var(--color-grey-200);
    border-radius: var(--border-radius-md);
    background-color: var(--color-grey-0);
    box-shadow: var(--shadow-sm);

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-grey-200);
    }
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.2rem;
  }
`;

function Restaurant() {
  const navigate = useNavigate();
  const { checkout } = useCheckout();
  const [searchParams] = useSearchParams();
  const { isLoading, bookings, count } = useRestaurantBookings();

  const searchValue = searchParams.get("search") || "";
  let displayBookings = bookings;
  if (searchValue) {
    const term = searchValue.toLowerCase();
    displayBookings = bookings?.filter(
      (b) =>
        b.id.toString().includes(term) ||
        b.guests?.fullName.toLowerCase().includes(term) ||
        b.guests?.email.toLowerCase().includes(term) ||
        b.cabins?.name?.toLowerCase().includes(term),
    );
  }

  if (isLoading) return <Spinner />;

  return (
    <>
      <PageHeader>
        <Heading as="h1">Restaurant Orders</Heading>
        <TableOperations>
          <SearchBar $width="min(46rem, 100%)" placeholder="Search by booking ID, guest name, email, or cabin name..." />
        </TableOperations>
      </PageHeader>

      {!displayBookings?.length ? (
        <Empty resourceName="checked-in bookings" />
      ) : (
      <StyledTable>
        <TableHeader>
          <div>Booking ID</div>
          <div>Guest</div>
          <div>Cabin</div>
          <div>Action</div>
          <div></div>
        </TableHeader>

        <Menus>
          {displayBookings.map((booking) => (
            <TableRow key={booking.id}>
              <div>{booking.id}</div>
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
      )}
      <Pagination count={count} />
    </>
  );
}

export default Restaurant;
