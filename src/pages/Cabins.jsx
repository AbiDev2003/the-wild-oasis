import styled from "styled-components";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import CabinTable from "../features/cabins/CabinTable";
import AddCabin from "../features/cabins/AddCabin";
import CabinTableOperations from "../features/cabins/CabinTableOperations";

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

function Cabins() {
  return (
    <>
      <PageHeader>
        <Heading as="h1">All cabins</Heading>
        <CabinTableOperations/>
      </PageHeader>

      <Row>
        <CabinTable />
        <AddCabin />
      </Row>
    </>
  );
}

export default Cabins;
