import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import { FiArrowLeft } from "react-icons/fi";
import PinField from "react-pin-field";
import { Link, useHistory, useLocation } from "react-router-dom";
import BeatLoader from "react-spinners/BeatLoader";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import logoImg from "../../assets/logo.svg";
import Button from "../../components/Button";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import {
  Container,
  Content,
  AnimationContainer,
  Background,
  ResendPin,
} from "./styles";

const SignIn: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const paramEmail = query.get("email");
  const paramPin = query.get("pin");

  const { user, signOut, updateUser } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();
  const formRef = useRef<FormHandles>(null);

  const nameHello = useMemo(() => {
    return user ? user.name : "";
  }, [user]);

  const email = useMemo(
    () => user.email || paramEmail,
    [paramEmail, user.email]
  );

  const handleSubmit = useCallback(
    async (code: string) => {
      try {
        setLoading(true);
        setError(false);
        if (code.length < 4) {
          setError(true);
          addToast({
            type: "error",
            title: "Error",
            description: "PIN must have 4 numbers",
          });
          return;
        }
        const data = {
          email: email?.replace(" ", "+"),
          pin: code,
        };
        await api.put("/confirm-email", data);

        if (user) {
          updateUser({ ...user, status: "active" });
          addToast({
            type: "success",
            title: "Welcome",
            description: "Your account has been activated!",
          });
          history.push("/configure");
          return;
        }

        addToast({
          type: "success",
          title: "Account activation",
          description: "Now you can signin on DAppGenius App",
        });
        history.push("/");
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Error",
          description: err.response.data.error,
        });
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [addToast, email, history, updateUser, user]
  );

  useEffect(() => {
    if (paramPin && email) {
      handleSubmit(paramPin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramPin]);

  const handleResendToken = useCallback(
    async (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      setLoadingResend(true);
      setLoading(true);
      try {
        await api.post("/resend-pin", {
          email: email?.replace(" ", "+"),
        });
        addToast({
          type: "info",
          title: "PIN resend",
          description: `An new PIN code has send to email: ${email}`,
        });
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Error",
          timeout: 5000,
          description:
            err.response.data.error ||
            "Looks like you hear an error resending the pin, please try again later.",
        });
      } finally {
        setLoadingResend(false);
        setLoading(false);
      }
    },
    [addToast, email]
  );

  const handleBackToLogin = useCallback(() => {
    if (user) {
      signOut();
    }

    history.push("/");
  }, [history, signOut, user]);

  return (
    <Container>
      <Content>
        <AnimationContainer>
          <img src={logoImg} alt="GoBarber" />

          <Form ref={formRef} onSubmit={() => handleSubmit(pin)}>
            <h2>Hello {!!nameHello && `, ${nameHello}`}!</h2>
            <p>
              Enter the PIN sent in the email, don't forget to check the spam
              box.
            </p>

            <PinField
              className="pin-field"
              length={4}
              validate="0123456789"
              onChange={setPin}
              onComplete={(code) => handleSubmit(code)}
              disabled={loading}
              style={{ borderColor: error ? "#ac3030" : "#ebebeb" }}
            />

            <ResendPin>
              {loadingResend ? (
                <BeatLoader color="#53BF99" size="10" />
              ) : (
                <Link to=" " onClick={handleResendToken}>
                  Resend email
                </Link>
              )}
            </ResendPin>

            <Button type="submit" isLoading={loading}>
              Next
            </Button>
          </Form>
          <Link to="/" onClick={handleBackToLogin}>
            <FiArrowLeft />
            Back to sign in
          </Link>
        </AnimationContainer>
      </Content>

      <Background />
    </Container>
  );
};

export default SignIn;
