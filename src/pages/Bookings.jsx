import styled from "styled-components";
import BookingTable from "../features/bookings/BookingTable";
import BookingTableOperations from "../features/bookings/BookingTableOperations";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import AddBooking from "./../features/bookings/AddBooking";
import SearchBar from "../ui/SearchBar";

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

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1.2rem;
  }
`;

function Bookings() {
  return (
    <>
      <PageHeader>
        <Heading as="h1">All bookings</Heading>
        <BookingTableOperations />
      </PageHeader>
      <Row>
        <SearchRow>
          <SearchBar $width="min(46rem, 100%)" placeholder="Search by guest name, email, booking ID or cabin name" />
          <AddBooking />
        </SearchRow>
        <BookingTable />
      </Row>
    </>
  );
}

export default Bookings;
