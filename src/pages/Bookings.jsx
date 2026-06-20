import styled from "styled-components";
import BookingTable from "../features/bookings/BookingTable";
import BookingTableOperations from "../features/bookings/BookingTableOperations";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import AddBooking from "./../features/bookings/AddBooking";
import SearchBar from "../ui/SearchBar";

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function Bookings() {
  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">All bookings</Heading>
        <BookingTableOperations />
      </Row>
      <Row>
        <SearchRow>
          <SearchBar $width="46rem" placeholder="Search by guest name, email, booking ID or cabin name" />
          <AddBooking />
        </SearchRow>
        <BookingTable />
      </Row>
    </>
  );
}

export default Bookings;
