import { useEffect } from "react";
import { useNavigate } from "react-router";
import supabase from "../services/supabase";
import { getEmployeeByEmail, signOutAndClear } from "../services/apiAuth";
import Spinner from "../ui/Spinner";
import styled from "styled-components";
import toast from "react-hot-toast";

const FullPage = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-grey-50);
`;

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const email = session.user.email;

      const employee = await getEmployeeByEmail(email);

      if (!employee) {
        await signOutAndClear();
        toast.error("Unauthorized. Only registered employees can sign in.");
        navigate("/login", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    }

    handleCallback();
  }, [navigate]);

  return (
    <FullPage>
      <Spinner />
    </FullPage>
  );
}

export default AuthCallback;