import { useMutation } from "@tanstack/react-query";

import toast from "react-hot-toast";
// import { useNavigate } from "react-router";
import { signup as signupApi } from "../../services/apiAuth";

export function useSignup() {
  const { mutate: signup, isPending } = useMutation({
    mutationFn: signupApi, 
    onSuccess: (user) => {
      console.log(user); 
      toast.success("Account successfully created ! Please verify the new account from the user's email address")
    }, 
    onError: (err) => {
      toast.error(err.message); 
    }, 
  });

  return { signup, isPending };
}
