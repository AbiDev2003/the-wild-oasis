import ButtonGroup from './../../ui/ButtonGroup';
import Modal from './../../ui/Modal';
import Button from './../../ui/Button';
import CreateBookingForm from './CreateBookingForm';

function AddBooking() {
  return (
    <>
      <ButtonGroup>
        <Modal>
          <Modal.Open opens="booking-form">
            <Button>+ Add new booking</Button>
          </Modal.Open>
          <Modal.Window name="booking-form">
            <CreateBookingForm />
          </Modal.Window>
        </Modal>
      </ButtonGroup>
    </>
  );
}

export default AddBooking;