import React, { useRef, useCallback, useState } from "react";
import { FiLogIn, FiMail, FiLock } from "react-icons/fi";
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
import { Container, Content, AnimationContainer, Background } from "./styles";

interface ISignUpFormData {
  email: string;
  password: string;
}

const SignIn: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { addToast } = useToast();

  const history = useHistory();
  const formRef = useRef<FormHandles>(null);

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

        await signIn({
          email: data.email,
          password: data.password,
        });

        // history.push("/dashboard");
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
  return (
    <Container>
      <Content>
        <AnimationContainer>
          <img src={logoImg} alt="DAppGenius" />

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
