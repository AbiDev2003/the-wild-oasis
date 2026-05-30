import { useSearchParams } from "react-router";
import Select from "./Select.jsx";

function SortBy({ options }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get("sortBy") || "";
  function handleChange(e) {
    searchParams.set("sortBy", e.target.value);
    setSearchParams(searchParams);
  }

  return <Select options={options} value={sortBy} onChange={handleChange} type="white" />;
}

export default SortBy;
