import toast from "react-hot-toast";
import { createEditCabin } from "../../services/apiCabins";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateCabin() {
  const queryClient = useQueryClient();
  const { mutate: createCabin, isPending: isCreating } = useMutation({
    // Wrap in arrow fn to avoid React Query v5 passing mutation context
    // as 2nd arg to createEditCabin, which was being captured as `id`
    // and causing the UPDATE path with .eq("id", [object Object])
    mutationFn: (data) => createEditCabin(data),
    onSuccess: () => {
      toast.success("New cabin successfully created");
      queryClient.invalidateQueries({
        queryKey: ["cabins"],
      });
      //   reset();
    },
    onError: () => toast.error("Cabin could not be created"),
  });
  return { createCabin, isCreating };
}
