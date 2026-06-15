import React, { useRef, useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiLogIn, FiMail, FiLock, FiKey } from "react-icons/fi";
import { Link, useHistory, useLocation } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import logoImg from "../../assets/logo.svg";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import getValidationErrors from "../../utils/getValidationErrors";
import { Container, Content, AnimationContainer, Background } from "./styles";

interface ISignUpFormData {
  email: string;
  password: string;
  code?: string;
}

const SignIn: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const { signIn, verifyEmailCode, completeSignIn, signOut } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();
  const location = useLocation();

  const formRef = useRef<FormHandles>(null);

  useEffect(() => {
    const resetPasswordToken = new URLSearchParams(location.search).get(
      "resetPasswordToken"
    );

    if (resetPasswordToken) {
      // Open reset links through the root route to avoid static-host direct-route 404s.
      history.replace(
        `/reset-password?token=${encodeURIComponent(resetPasswordToken)}`
      );
    }
  }, [history, location.search]);

  useEffect(() => {
    signOut();
  }, [signOut]);

  const handleSubmit = useCallback(
    async (data: ISignUpFormData) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});
        const schema = verificationEmail
          ? Yup.object().shape({
              code: Yup.string().required("Login code is required"),
            })
          : Yup.object().shape({
              email: Yup.string().required().email(),
              password: Yup.string().required(),
            });

        await schema.validate(data, { abortEarly: false });

        if (verificationEmail) {
          const authState = await verifyEmailCode(
            verificationEmail,
            data.code || ""
          );

          completeSignIn(authState);
          history.replace("/dashboard");
          return;
        }

        const authState = await signIn({
          email: data.email,
          password: data.password,
        });

        if ("verificationRequired" in authState) {
          setVerificationEmail(authState.email);
          formRef.current?.reset();
          addToast({
            type: "info",
            title: "Check your email",
            description: "Enter the login code we sent to finish signing in.",
          });
          return;
        }

        completeSignIn(authState);
        history.replace("/dashboard");
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
          description:
            err.response?.data?.error ||
            "Unable to authenticate. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      verificationEmail,
      signIn,
      verifyEmailCode,
      completeSignIn,
      history,
      addToast,
    ]
  );

  const handleBackToPassword = useCallback(() => {
    setVerificationEmail("");
    formRef.current?.reset();
  }, []);

  return (
    <Container>
      <Content>
        <AnimationContainer>
          <img src={logoImg} alt="DAppGenius" />

          <Form ref={formRef} onSubmit={handleSubmit} autoComplete="off">
            {/* <h1>Faça seu logon</h1> */}

            {!verificationEmail ? (
              <>
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
              </>
            ) : (
              <>
                <p>Check your email for a login code.</p>
                <Input
                  name="code"
                  icon={FiKey}
                  placeholder="Login code"
                  isLoading={loading}
                />
              </>
            )}

            <Button type="submit" isLoading={loading}>
              {verificationEmail ? "Verify code" : "Sign In"}
            </Button>

            {verificationEmail ? (
              <Link to="/" onClick={handleBackToPassword}>
                <FiArrowLeft />
                Back to sign in
              </Link>
            ) : (
              <Link to="/forgot-password">Forgot Password?</Link>
            )}
          </Form>
          {!verificationEmail && (
            <Link to="/signup">
              <FiLogIn />
              Create an account
            </Link>
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
