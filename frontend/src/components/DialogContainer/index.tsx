import { useHistory } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { IDialogMessage } from "../../hooks/dialog";

import "./styles.css";

const DialogContainer = (message: IDialogMessage) => {
  const SwalContainer = withReactContent(Swal);
  const { goBack, push } = useHistory();

  const Dialog = SwalContainer;
  const {
    isOpen = false,
    title,
    text,
    html,
    icon = "info",
    showCancelButton = !!message.cancelButtonText,
    showConfirmButton = true,
    confirmButtonText = "Yes, delete it!",
    cancelButtonText = "No, keep it",
    redirectTo,
    confirm,
  } = message;

  isOpen &&
    Dialog.fire({
      title,
      text,
      icon,
      html,
      showCancelButton,
      showConfirmButton,
      customClass: {
        title: "title-class",
        popup: "popup-class",
        content: "content-class",
      },
      confirmButtonText,
      cancelButtonText,
      showLoaderOnConfirm: confirm?.showLoaderOnConfirm,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: () => {
        if (confirm?.function) {
          return confirm
            .function()
            .then(() => {
              Swal.fire({
                // title: 'Auto close alert!',
                icon: confirm.successIcon || "success",
                html: confirm.successMessage,
                timer: confirm.timeoutToClose || 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                // }).then(() => (redirectTo ? push(redirectTo) : goBack()));
              }).then(() => (redirectTo ? push(redirectTo) : null));
            })
            .catch((err) => {
              // Dialog.fire(confirm.successMessage || err.response.data.error, confirm.errorIcon || 'error');
              Swal.fire({
                // title: 'Auto close alert!',
                icon: confirm.errorIcon || "error",
                html: confirm.errorMessage,
                timer: confirm.timeoutToClose || 2000,
                timerProgressBar: !!confirm.timeoutToClose,
                showConfirmButton: !confirm.timeoutToClose,
                // }).then(() => (redirectTo ? push(redirectTo) : goBack()));
              }).then(() => (redirectTo ? push(redirectTo) : null));
            });
        }
      },
    }).then((result) => {
      if (result.value) {
        // Container.fire(
        //   "Deleted!",
        //   "Your imaginary file has been deleted.",
        //   "success"
        // );
        // For more information about handling dismissals please visit
        // https://sweetalert2.github.io/#handling-dismissals
        // confirm?.function();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        return "";
      }
    });
};

export default DialogContainer;
