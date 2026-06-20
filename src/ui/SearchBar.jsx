import { useSearchParams } from "react-router";
import { HiMagnifyingGlass } from "react-icons/hi2";
import styled from "styled-components";
import { useState, useRef } from "react";

const StyledSearchBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Icon = styled.span`
  position: absolute;
  left: 1rem;
  font-size: 1.6rem;
  color: var(--color-grey-400);
  pointer-events: none;
`;

const Input = styled.input`
  border: 1px solid var(--color-grey-300);
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-sm);
  padding: 0.65rem 3rem 0.65rem 3.6rem;
  box-shadow: var(--shadow-sm);
  font-size: 1.4rem;
  width: ${(props) => props.$width || "26rem"};
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: var(--color-brand-600);
    box-shadow: 0 0 0 2px var(--color-brand-200);
  }

  &::placeholder {
    color: var(--color-grey-400);
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 0.4rem;
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--color-grey-400);
  padding: 0.2rem 0.8rem;
  line-height: 1;

  &:hover {
    color: var(--color-grey-600);
  }
`;

function SearchBar({
  placeholder = "Search...",
  filterField = "search",
  ...props
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(
    searchParams.get(filterField) || "",
  );
  const debounceRef = useRef(null);

  function handleChange(e) {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(filterField, value);
      } else {
        params.delete(filterField);
      }
      if (params.get("page")) params.set("page", 1);
      setSearchParams(params);
    }, 400);
  }

  function handleClear() {
    setInputValue("");
    const params = new URLSearchParams(searchParams);
    params.delete(filterField);
    if (params.get("page")) params.set("page", 1);
    setSearchParams(params);
  }

  return (
    <StyledSearchBar>
      <Icon>
        <HiMagnifyingGlass />
      </Icon>
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        $width={props.$width}
      />
      {inputValue && <ClearButton onClick={handleClear}>×</ClearButton>}
    </StyledSearchBar>
  );
}

export default SearchBar;
