import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../../services/apiAuth";
import toast from "react-hot-toast";

export function useForgotPassword() {
  const { mutate: sendResetEmail, isPending } = useMutation({
    mutationFn: (email) => resetPassword(email),
    onSuccess: () => toast.success("Check your email for the reset link"),
    onError: (err) => toast.error(err.message),
  });
  return { sendResetEmail, isPending };
}
