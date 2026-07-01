import styled from "styled-components";
import { HiBars3 } from "react-icons/hi2";
import HeaderMenu from "./HeaderMenu";
import UserAvatar from "../features/authentication/UserAvatar";

const StyledHeader = styled.header`
  background-color: var(--color-grey-0);
  padding: 1.2rem 4.8rem;
  border-bottom: 1px solid var(--color-grey-100);
  display: flex;
  gap: 2.4rem;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 1024px) {
    padding: 1.2rem 1.6rem;
  }
`;

const Hamburger = styled.button`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 2.8rem;
    cursor: pointer;
    color: var(--color-grey-600);
    padding: 0.4rem;
    border-radius: var(--border-radius-sm);
    margin-right: auto;

    &:hover {
      background-color: var(--color-grey-100);
    }
  }
`;

function Header({ onToggleSidebar }) {
  return (
    <StyledHeader>
      <Hamburger onClick={onToggleSidebar}>
        <HiBars3 />
      </Hamburger>
      <UserAvatar />
      <HeaderMenu />
    </StyledHeader>
  );
}

export default Header;
