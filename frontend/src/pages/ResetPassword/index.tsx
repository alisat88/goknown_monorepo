import React, { useRef, useCallback, useState } from "react";
import { FiLock } from "react-icons/fi";
import { useHistory, useLocation } from "react-router-dom";
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

interface IResetPasswordFormData {
  password: string;
  password_confirmation: string;
}

const SignIn: React.FC<React.PropsWithChildren<unknown>> = () => {
  const formRef = useRef<FormHandles>(null);

  const { addToast } = useToast();
  const history = useHistory();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const token = new URLSearchParams(location.search).get("token") || "";

  const handleSubmit = useCallback(
    async (data: IResetPasswordFormData) => {
      setLoading(true);
      try {
        if (!token) {
          addToast({
            type: "error",
            title: "Invalid reset link",
            description: "Request a new password reset email and try again.",
          });
          return;
        }

        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          password: Yup.string().required(),
          password_confirmation: Yup.string()
            .required()
            .oneOf([Yup.ref("password")], "Passwords do not match"),
        });

        await schema.validate(data, { abortEarly: false });
        const { password, password_confirmation } = data;
        await api.post("/password/reset", {
          password,
          password_confirmation,
          token,
        });

        addToast({
          type: "success",
          title: "Password reset successfully",
          description:
            "Sign in with your new password to receive a login code.",
        });
        history.push("/");
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }
        addToast({
          type: "error",
          title: "Error resetting password",
          description:
            "An error occurred while resetting your password, please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
    [token, history, addToast]
  );
  return (
    <Container>
      <Content>
        <AnimationContainer>
          <img src={logoImg} alt="DAppGenius" />

          <Form ref={formRef} onSubmit={handleSubmit}>
            <h1>Reset password</h1>

            {!token && (
              <p>This reset link is missing or invalid. Request a new one.</p>
            )}

            <Input
              name="password"
              icon={FiLock}
              type="password"
              placeholder="New password"
              isLoading={loading}
            />

            <Input
              name="password_confirmation"
              icon={FiLock}
              type="password"
              placeholder="Confirm password"
              isLoading={loading}
            />

            <Button type="submit" isLoading={loading} disabled={!token}>
              Reset password
            </Button>
          </Form>
        </AnimationContainer>
      </Content>

      <Background />
    </Container>
  );
};

export default SignIn;
