import { useMutation } from "@tanstack/react-query";
import { updatePassword } from "../../services/apiAuth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

export function useUpdatePassword() {
    const navigate = useNavigate();
  const { mutate: updateUserPassword, isPending } = useMutation({
    mutationFn: (password) => updatePassword(password),
    onSuccess: () => {
        toast.success("Password updated successfully");
        navigate("/login");
    },
    onError: (err) => toast.error(err.message),
  });
  return { updateUserPassword, isPending };
}
