import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiLogIn,
  FiMail,
  FiLock,
} from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import logoImg from "../../assets/logo.svg";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import getValidationErrors from "../../utils/getValidationErrors";
import {
  Container,
  Content,
  AnimationContainer,
  Background,
  VerificationActions,
  VerificationCard,
  VerificationError,
  VerificationHelper,
} from "./styles";

interface ISignUpFormData {
  email: string;
  password: string;
}

const SignIn: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [pendingAuth, setPendingAuth] = useState<Awaited<
    ReturnType<ReturnType<typeof useAuth>["signIn"]>
  > | null>(null);
  const { signIn, completeSignIn, signOut } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();

  const formRef = useRef<FormHandles>(null);
  // Demo-only fallback. Production demos should set REACT_APP_DEMO_2FA_CODE.
  const expectedDemoCode = process.env.REACT_APP_DEMO_2FA_CODE || "123456";

  useEffect(() => {
    signOut();
  }, [signOut]);

  const handleSubmit = useCallback(
    async (data: ISignUpFormData) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          email: Yup.string().required().email(),
          password: Yup.string().required(),
        });

        await schema.validate(data, { abortEarly: false });

        const authState = await signIn({
          email: data.email,
          password: data.password,
        });

        setPendingAuth(authState);
        setVerificationCode("");
        setVerificationError("");
      } catch (err: any) {
        console.error("Sign in error:", err);
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Authentication error",
          description: err.response.data.error,
        });
      } finally {
        setLoading(false);
      }
    },
    [signIn, addToast]
  );

  const handleVerify = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!pendingAuth) {
        setVerificationError("Please sign in again before verifying.");
        return;
      }

      if (verificationCode.trim() !== expectedDemoCode) {
        setVerificationError(
          "Verification code did not match. Please check the presenter code and try again."
        );
        return;
      }

      completeSignIn(pendingAuth);
      history.replace("/dashboard");
    },
    [completeSignIn, expectedDemoCode, history, pendingAuth, verificationCode]
  );

  const handleBackToLogin = useCallback(() => {
    setPendingAuth(null);
    setVerificationCode("");
    setVerificationError("");
    formRef.current?.reset();
  }, []);

  return (
    <Container>
      <Content>
        <AnimationContainer>
          <img src={logoImg} alt="DAppGenius" />

          {!pendingAuth ? (
            <>
              <Form ref={formRef} onSubmit={handleSubmit} autoComplete="off">
                {/* <h1>Faça seu logon</h1> */}

                <Input
                  name="email"
                  icon={FiMail}
                  placeholder="E-mail"
                  isLoading={loading}
                />
                <Input
                  name="password"
                  icon={FiLock}
                  type="password"
                  placeholder="Password"
                  isLoading={loading}
                />

                <Button type="submit" isLoading={loading}>
                  Sign In
                </Button>

                <Link to="/forgot-password">Forgot Password?</Link>
              </Form>
              <Link to="/signup">
                <FiLogIn />
                Create an account
              </Link>
            </>
          ) : (
            <VerificationCard onSubmit={handleVerify}>
              <FiCheckCircle />
              <h1>Demo Verification</h1>
              <VerificationHelper>
                For this demo, enter the verification code provided by the
                presenter.
              </VerificationHelper>

              <label htmlFor="demo-verification-code">
                Verification code
                <input
                  id="demo-verification-code"
                  value={verificationCode}
                  onChange={(event) => {
                    setVerificationCode(event.target.value);
                    setVerificationError("");
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                />
              </label>

              {verificationError ? (
                <VerificationError>{verificationError}</VerificationError>
              ) : null}

              <VerificationActions>
                <button type="button" onClick={handleBackToLogin}>
                  <FiArrowLeft />
                  Back
                </button>
                <Button type="submit">Verify and continue</Button>
              </VerificationActions>
            </VerificationCard>
          )}
          <Link to="/privacy-policy" target="_blank" style={{ marginTop: 50 }}>
            Privacy Policy
          </Link>
        </AnimationContainer>
      </Content>

      <Background />
    </Container>
  );
};

export default SignIn;
