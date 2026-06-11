import { useEffect, useState } from "react";
import { Link } from "react-router";
import styled from "styled-components";
import Logo from "../ui/Logo";
import Heading from "../ui/Heading";
import Form from "../ui/Form";
import Button from "../ui/Button";
import FormRowVertical from "../ui/FormRowVertical";
import Spinner from "../ui/Spinner";
import SpinnerMini from "../ui/SpinnerMini";
import { useUpdatePassword } from "../features/authentication/useUpdatePassword";
import supabase from "../services/supabase";
import PasswordInput from "../ui/PasswordInput";

const LoginLayout = styled.main`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 48rem;
  align-content: center;
  justify-content: center;
  gap: 3.2rem;
  background-color: var(--color-grey-50);
`;

const StyledLink = styled(Link)`
  font-size: 1.3rem;
  color: var(--color-brand-600);
  text-align: center;
  display: block;
  margin-top: 1.2rem;
  text-decoration: underline;
`;

function ResetPassword() {
  const [validReset, setValidReset] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { updateUserPassword, isPending } = useUpdatePassword();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidReset(true);
    });

    setTimeout(() => {
      setValidReset((prev) => (prev === null ? false : prev));
    }, 3000);

    return () => listener?.subscription.unsubscribe();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) return;
    updateUserPassword(password);
  }

  if (validReset === null) return <Spinner />;

  if (validReset === false)
    return (
      <LoginLayout>
        <Logo />
        <Heading as="h4">Invalid or expired link</Heading>
        <p style={{ textAlign: "center", color: "var(--color-grey-500)" }}>
          The password reset link is invalid or has expired.
        </p>
        <StyledLink to="/forgot-password">Request a new reset link</StyledLink>
        <StyledLink to="/login" style={{ marginTop: 0 }}>
          Back to login
        </StyledLink>
      </LoginLayout>
    );

  return (
    <LoginLayout>
      <Logo />
      <Heading as="h4">Reset your password</Heading>
      <Form onSubmit={handleSubmit}>
        <FormRowVertical label="New password">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
          />
        </FormRowVertical>
        <FormRowVertical
          label="Confirm password"
          error={
            confirmPassword && password !== confirmPassword
              ? "Passwords do not match"
              : ""
          }
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
          />
        </FormRowVertical>
        <FormRowVertical>
          <Button size="large" disabled={isPending}>
            {!isPending ? "Update password" : <SpinnerMini />}
          </Button>
        </FormRowVertical>
      </Form>
      <StyledLink to="/login">Back to login</StyledLink>
    </LoginLayout>
  );
}

export default ResetPassword;
