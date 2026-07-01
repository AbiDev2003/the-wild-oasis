import styled from "styled-components";
import DashboardLayout from "../features/dashboard/DashboardLayout";
import Heading from "../ui/Heading";
import DashboardFilter from "./../features/dashboard/DashboardFilter";

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

function Dashboard() {
  return (
    <>
      <PageHeader>
        <Heading as="h1">Dashboard</Heading>
        <DashboardFilter />
      </PageHeader>
      <DashboardLayout />
    </>
  );
}

export default Dashboard;
