import Button from "../../ui/Button";
import FormRowVertical from "../../ui/FormRowVertical";
import { useLoginWithOAuth } from "./useLoginWithOAuth";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

function OAuthButtons() {
  const { loginOAuth, isPending } = useLoginWithOAuth();

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          margin: "1.2rem 0",
        }}
      >
        <span
          style={{
            flex: 1,
            height: "1px",
            background: "var(--color-grey-200)",
          }}
        />
        <span
          style={{
            color: "var(--color-grey-500)",
            fontSize: "1.2rem",
          }}
        >
          OR
        </span>
        <span
          style={{
            flex: 1,
            height: "1px",
            background: "var(--color-grey-200)",
          }}
        />
      </div>

      <FormRowVertical>
        <Button
          size="large"
          variation="secondary"
          onClick={() => loginOAuth("google")}
          disabled={isPending}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.8rem",
          }}
        >
          <FcGoogle style={{ fontSize: "1.8rem" }} />
          Continue with Google
        </Button>
      </FormRowVertical>

      <FormRowVertical>
        <Button
          size="large"
          variation="secondary"
          onClick={() => loginOAuth("github")}
          disabled={isPending}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.8rem",
          }}
        >
          <FaGithub style={{ fontSize: "1.8rem" }} />
          Continue with GitHub
        </Button>
      </FormRowVertical>
    </>
  );
}

export default OAuthButtons;
