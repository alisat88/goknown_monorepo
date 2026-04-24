import { useCallback, useContext, useRef, useState } from "react";
import { AiOutlineMobile } from "react-icons/ai";
import { FiArrowLeft } from "react-icons/fi";
import PinField from "react-pin-field";
import { Link, useHistory } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { useAuth } from "../../../hooks/auth";
import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import getValidationErrors from "../../../utils/getValidationErrors";

// import { SocketContext } from "../../../hooks/socket";
// import { useSocket } from "../../../hooks/socket";

export function FormVerify() {
  const [loadingForm, setLoadingForm] = useState(false);
  const [authenticationCode, setAuthenticationCode] = useState("");
  const [error, setError] = useState(false);
  const formRef = useRef<FormHandles>(null);
  const { user, signOut, updateUser } = useAuth();

  const { addToast } = useToast();
  // const socket = useContext(SocketContext);
  const history = useHistory();

  const handleSubmit = useCallback(
    async (code: any) => {
      setLoadingForm(true);
      setError(false);
      // time to connect socket before history push

      if (code.length < 4) {
        setError(true);
        addToast({
          type: "error",
          title: "Error",
          description: "PIN must have 4 numbers",
        });
        return;
      }
      try {
        const response = await api.post("/sessions/verify-sms", {
          twoFactorAuthenticationCode: code,
        });

        if (response.data) {
          updateUser({ ...user, hasVerfiedTwoFactorCode: true });

          setLoadingForm(false);

          history.push("/dashboard");
        } else {
          setAuthenticationCode("");
          setError(true);
          addToast({
            type: "error",
            title: "ERROR",
            description: "Invalid verification code",
          });
        }
      } catch (error: any) {
        if (error instanceof Yup.ValidationError) {
          const errors = getValidationErrors(error);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "ERROR",
          description: error.response.data.message || error.response.data.error,
        });
      } finally {
        setLoadingForm(false);
      }
    },
    [addToast, history, updateUser, user]
  );

  const handleSendNewCode = useCallback(async () => {
    try {
      await api.post("/sessions/send-sms");

      addToast({
        type: "success",
        title: "We've sent a new login verification code",
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "ERROR",
        description: error.response.data.message || error.response.data.error,
      });
    }
  }, [addToast]);

  const handleBackToLogin = useCallback(() => {
    if (user) {
      signOut();
      // disconnectSocket();
    }

    history.push("/");
  }, [history, signOut, user]);

  return (
    <Form ref={formRef} onSubmit={() => handleSubmit(authenticationCode)}>
      <legend>Enter your verification code</legend>
      {/* <Input
        type="number"
        name="authenticationcode"
        placeholder="6-digit code"
      /> */}
      <div className="pin-field-content">
        <PinField
          className="pin-field"
          length={4}
          validate="0123456789"
          onChange={setAuthenticationCode}
          onComplete={(code) => handleSubmit(code)}
          disabled={loadingForm}
          style={{ borderColor: error ? "#ac3030" : "#ebebeb" }}
        />
      </div>

      <section>
        <AiOutlineMobile size={24} />
        <p>We've sent a login verification code.</p>
        <Link to="" onClick={handleSendNewCode}>
          {" "}
          Code not received?
        </Link>
      </section>

      <Button type="submit" isLoading={loadingForm}>
        Verify
      </Button>

      <Link to="/" onClick={handleBackToLogin}>
        <FiArrowLeft />
        Back to sign in
      </Link>
    </Form>
  );
}
