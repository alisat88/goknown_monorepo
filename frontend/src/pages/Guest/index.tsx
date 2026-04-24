import React, { useCallback, useRef, useState } from "react";
import { FiLock } from "react-icons/fi";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import logoImg from "../../assets/logo.svg";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useGuest } from "../../hooks/guest";
import { useToast } from "../../hooks/toast";
import getValidationErrors from "../../utils/getValidationErrors";
import { Container } from "./styles";

interface ISignInFormData {
  password: string;
}

const Guest: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { addToast } = useToast();
  const { guest_token, guestSignIn } = useGuest();

  const formRef = useRef<FormHandles>(null);

  const handleSubmit = useCallback(
    async (data: ISignInFormData) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          password: Yup.string().required(),
        });

        await schema.validate(data, { abortEarly: false });

        await guestSignIn({ password: data.password });
      } catch (error: any) {
        if (error instanceof Yup.ValidationError) {
          const errors = getValidationErrors(error);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Authentication error",
          description: error.response.data.error,
        });
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  return (
    <Container>
      <Form ref={formRef} onSubmit={handleSubmit}>
        <img src={logoImg} alt="GoBarber" />

        <Input
          name="password"
          placeholder="Password"
          type="password"
          icon={FiLock}
        />

        <Button type="submit" isLoading={loading}>
          Unlock guest access
        </Button>
      </Form>
    </Container>
  );
};

export default Guest;
