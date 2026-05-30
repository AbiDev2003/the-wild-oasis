import Filter from "../../ui/Filter"
import SortBy from "../../ui/SortBy.jsx";
import TableOperations from './../../ui/TableOperations.jsx';
function CabinTableOperations() {
    return (
        <TableOperations>
            <Filter 
                filterField="discount"
                options={[
                    {value: "all", label: "All"}, 
                    {value: "no-discount", label: "No discount"}, 
                    {value: "with-discount", label: "With discount"}, 
                ]}
            />
            <SortBy
                options={[
                    {value: 'name-asc', label: "Sort by name(A - z)"}, 
                    {value: 'name-desc', label: "Sort by name(Z - a)"}, 
                    {value: 'regularPrice-asc', label: "Sort by price(Low first)"}, 
                    {value: 'regularPrice-desc', label: "Sort by price(High first)"}, 
                    {value: 'maxCapacity-asc', label: "Sort by capacity(Low first)"}, 
                    {value: 'maxCapacity-desc', label: "Sort by capacity(High first)"}, 
                ]}
            />
        </TableOperations>
    )
}

export default CabinTableOperations
