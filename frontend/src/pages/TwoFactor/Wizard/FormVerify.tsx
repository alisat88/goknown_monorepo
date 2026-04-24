import { useCallback, useRef, useState } from "react";
import { AiOutlineMobile } from "react-icons/ai";
import { FiArrowLeft } from "react-icons/fi";
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

// import { useSocket } from "../../../hooks/socket";

export function FormVerify() {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<FormHandles>(null);
  const { user, signOut, updateUser } = useAuth();
  // const { disconnectSocket } = useSocket();
  const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: any, { reset }: any) => {
      setLoading(true);
      console.log(data);
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          authenticationcode: Yup.number().required(),
        });

        await schema.validate(data, { abortEarly: false });

        await api.post("/sessions/2fa/authenticate", {
          twoFactorAuthenticationCode: Number(data.authenticationcode),
        });
        updateUser({ ...user, hasVerfiedTwoFactorCode: true });
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
        setLoading(false);
      }
    },
    [addToast, updateUser, user]
  );

  const handleBackToLogin = useCallback(() => {
    if (user) {
      // disconnectSocket();
      signOut();
    }

    history.push("/");
  }, [history, signOut, user]);

  return (
    <Form ref={formRef} onSubmit={handleSubmit}>
      <legend>Authentication code</legend>
      <Input
        type="number"
        name="authenticationcode"
        placeholder="6-digit code"
      />

      <section>
        <AiOutlineMobile size={24} />
        <p>
          Open Google Authenticator App on your device to view your
          authentication code.
        </p>
      </section>

      <Button type="submit" isLoading={loading}>
        Verify
      </Button>

      <Link to="/" onClick={handleBackToLogin}>
        <FiArrowLeft />
        Back to sign in
      </Link>
    </Form>
  );
}
