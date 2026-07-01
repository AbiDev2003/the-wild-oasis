import styled from "styled-components";
import { HiXMark } from "react-icons/hi2";
import Logo from "./Logo";
import MainNav from "./MainNav";

const StyledSidebar = styled.aside`
  background-color: var(--color-grey-0);
  padding: 3.2rem 2.4rem;
  border-right: 1px solid var(--color-grey-100);
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 3.2rem;

  @media (max-width: 1024px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 26rem;
    z-index: 10;
    transform: ${({ $isOpen }) =>
      $isOpen ? "translateX(0)" : "translateX(-100%)"};
    transition: transform 0.3s ease;
  }
`;

const CloseButton = styled.button`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 1.2rem;
    right: 1.2rem;
    background: none;
    border: none;
    font-size: 2.4rem;
    cursor: pointer;
    color: var(--color-grey-500);
    padding: 0.4rem;
    border-radius: var(--border-radius-sm);

    &:hover {
      background-color: var(--color-grey-100);
    }
  }
`;

function Sidebar({ isOpen, onClose }) {
  return (
    <StyledSidebar $isOpen={isOpen}>
      <CloseButton onClick={onClose}>
        <HiXMark />
      </CloseButton>
      <Logo />
      <MainNav />
    </StyledSidebar>
  );
}

export default Sidebar;
