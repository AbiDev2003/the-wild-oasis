import { useMutation } from "@tanstack/react-query";
import { loginWithOAuth } from "../../services/apiAuth";
import toast from "react-hot-toast";

export function useLoginWithOAuth() {
  const { mutate: loginOAuth, isPending } = useMutation({
    mutationFn: loginWithOAuth,
    onError: (err) => {
      console.error(err.message);
      toast.error("Failed to sign in with provider");
    },
  });

  return { loginOAuth, isPending };
}
