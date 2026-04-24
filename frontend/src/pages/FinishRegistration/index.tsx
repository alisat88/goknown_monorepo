import React, { useCallback, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiLock, FiUser } from "react-icons/fi";
import { useHistory, Link } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import logoImg from "../../assets/logo.svg";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";
import { AnimationContainer, Background, Container, Content } from "./styles";

const FinishRegistration: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);

  const { user, signOut, updateUser } = useAuth();
  const { addToast } = useToast();
  const history = useHistory();
  const formRef = useRef<FormHandles>(null);

  const nameHello = useMemo(() => {
    return user ? user.name : "";
  }, [user]);

  const handleBackToLogin = useCallback(() => {
    if (user) {
      signOut();
    }

    history.push("/");
  }, [history, signOut, user]);

  const handleSubmit = useCallback(
    async (data: any) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required("Nome obrigatório"),
          old_password: Yup.string().required(),
          password: Yup.string().when("old_password", {
            is: (val) => !!val.length,
            then: Yup.string().required(),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string()
            .when("old_password", {
              is: (val) => !!val.length,
              then: Yup.string().required(),
              otherwise: Yup.string(),
            })
            .oneOf(
              [Yup.ref("password"), undefined],
              "New password don't match"
            ),
        });
        await schema.validate(data, { abortEarly: false });
        const { name, password, old_password, password_confirmation } = data;

        const formData = {
          name,
          ...(old_password
            ? {
                old_password,
                password,
                password_confirmation,
              }
            : {}),
        };

        const response = await api.put("/profile", formData);
        updateUser({
          ...response.data,
          current_balance: user.current_balance,
          formattedBalance: user.formattedBalance,
        });
        addToast({
          type: "success",
          title: "Finished registration!",
          description: "Welcome to DAppGenius App",
        });
        history.push("/dashboard");
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }
        addToast({
          type: "error",
          title: "Update error",
          description:
            "There was an error updating your profile, please try again",
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
          <img src={logoImg} alt="GoBarber" />

          <Form ref={formRef} onSubmit={handleSubmit}>
            <h2>Hello {!!nameHello && `, ${nameHello}`}!</h2>
            <p>
              To complete your registration, please complete the fields below
            </p>

            <Input
              name="name"
              icon={FiUser}
              placeholder="Name"
              isLoading={loading}
            />
            <Input
              containerStyle={{ marginTop: "24px" }}
              name="old_password"
              icon={FiLock}
              type="password"
              placeholder="Temporary password"
              information="This password will be sended to your email"
              isLoading={loading}
            />
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
              placeholder="Confirm new password"
              isLoading={loading}
            />

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

export default FinishRegistration;
