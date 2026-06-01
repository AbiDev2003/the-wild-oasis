// import { useState } from "react";
import CreateCabinForm from "./CreateCabinForm.jsx";
import Button from "../../ui/Button.jsx";
import Modal from "../../ui/Modal.jsx";
import ButtonGroup from "../../ui/ButtonGroup.jsx";

// version 1
// function AddCabin() {
//   const [isOpenModal, setIsOpenModal] = useState(false);
//   return (
//     <>
//       <Button onClick={() => setIsOpenModal((show) => !show)}>
//         Add new cabin
//       </Button>
//       {isOpenModal && (
//         <Modal onClose={() => setIsOpenModal((show) => !show)}>
//           <CreateCabinForm
//             onCloseModal={() => setIsOpenModal((show) => !show)}
//           />
//         </Modal>
//       )}
//     </>
//   );
// }

// version 2: Converting modal into compound component, which means we can use it without having to manage the state of the modal in the parent component. This makes it more reusable and easier to use in different parts of the application.
function AddCabin() {
  return (
    <>
      <ButtonGroup>
        <Modal>
          <Modal.Open opens="cabin-form">
            <Button>+ Add new cabin</Button>
          </Modal.Open>
          <Modal.Window name="cabin-form">
            <CreateCabinForm />
          </Modal.Window>
        </Modal>
      </ButtonGroup>

      {/* <Modal>
        <Modal.Open opens="table">
          <Button>Show table</Button>
        </Modal.Open>
        <Modal.Window name="table">
          <CabinTable />
        </Modal.Window>
      </Modal> */}
    </>
  );
}

export default AddCabin;
