import { useState } from "react";
import styled from "styled-components";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import Input from "./Input";

const InputWrapper = styled.div`
  position: relative;
`;

const StyledInput = styled(Input)`
  padding-right: 4rem;
  width: 100%;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-grey-500);

  &:hover {
    color: var(--color-grey-700);
  }
`;

function PasswordInput(props) {
  const [show, setShow] = useState(false);

  return (
    <InputWrapper>
      <StyledInput {...props} type={show ? "text" : "password"} />
      <ToggleButton type="button" onClick={() => setShow((s) => !s)}>
        {show ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
      </ToggleButton>
    </InputWrapper>
  );
}

export default PasswordInput;
