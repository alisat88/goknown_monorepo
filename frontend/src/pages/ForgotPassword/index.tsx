import React, { useState, useRef, useCallback } from "react";
import { FiLogIn, FiMail } from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import logoImg from "../../assets/logo.svg";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";
import { Container, Content, AnimationContainer, Background } from "./styles";

interface IForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<FormHandles>(null);

  const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: IForgotPasswordFormData) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          email: Yup.string().required().email(),
        });

        await schema.validate(data, { abortEarly: false });

        // password recovery

        await api.post("/password/forgot", { email: data.email });
        addToast({
          type: "success",
          title: "Recovery email has been sent",
          description: "We sent an email to reset your password.",
        });
        // history.push('/dashboard');
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }
        addToast({
          type: "error",
          title: "Password recovery error",
          description:
            "An error occurred while trying to re-perform password recovery, please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );
  return (
    <Container>
      <Content>
        <AnimationContainer>
          <img src={logoImg} alt="DAppGenius" />

          <Form ref={formRef} onSubmit={handleSubmit}>
            <h1>Forgot password</h1>

            <Input name="email" icon={FiMail} placeholder="E-mail" />

            <Button isLoading={loading} type="submit">
              Recover Password
            </Button>
          </Form>
          <Link to="/">
            <FiLogIn />
            Back to sign in
          </Link>
        </AnimationContainer>
      </Content>

      <Background />
    </Container>
  );
};

export default ForgotPassword;
