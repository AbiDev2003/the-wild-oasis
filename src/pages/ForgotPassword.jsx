import { useState } from "react";
import { Link } from "react-router";
import styled from "styled-components";
import Logo from "../ui/Logo";
import Heading from "../ui/Heading";
import Form from "../ui/Form";
import Input from "../ui/Input";
import Button from "../ui/Button";
import FormRowVertical from "../ui/FormRowVertical";
import SpinnerMini from "../ui/SpinnerMini";
import { useForgotPassword } from "../features/authentication/useForgotPassword";

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

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { sendResetEmail, isPending } = useForgotPassword();

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    sendResetEmail(email);
  }

  return (
    <LoginLayout>
      <Logo />
      <Heading as="h4">Forgot your password?</Heading>
      <Form onSubmit={handleSubmit}>
        <FormRowVertical label="Email address">
          <Input
            type="email"
            id="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </FormRowVertical>
        <FormRowVertical>
          <Button size="large" disabled={isPending}>
            {!isPending ? "Send reset link" : <SpinnerMini />}
          </Button>
        </FormRowVertical>
      </Form>
      <StyledLink to="/login">Back to login</StyledLink>
    </LoginLayout>
  );
}

export default ForgotPassword;
