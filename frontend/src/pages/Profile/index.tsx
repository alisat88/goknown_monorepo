import React, { ChangeEvent, useCallback, useRef, useState } from "react";
import { FiMail, FiUser, FiLock, FiCamera, FiPower } from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Avatar } from "../../styles/global";
import getValidationErrors from "../../utils/getValidationErrors";
import { Container, Content, AvatarInput } from "./styles";
// import { useSocket } from "../../hooks/socket";

interface IProfileData {
  name: string;
  email: string;
  old_password: string;
  password: string;
  password_confirmation: string;
}

const Profile: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const history = useHistory();

  const { user, updateUser, signOut } = useAuth();
  // const { disconnectSocket } = useSocket();

  const handleSubmit = useCallback(
    async (data: IProfileData) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required("Nome obrigatório"),
          old_password: Yup.string(),
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
          hasVerfiedTwoFactorCode: true,
          twoFactorAuthentication: true,
          current_balance: user.current_balance,
          formattedBalance: user.formattedBalance,
        });
        addToast({
          type: "success",
          title: "Updated profile!",
          description: "Your profile information has been updated successfully",
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
    [addToast, history, updateUser, user.current_balance, user.formattedBalance]
  );

  const handleAvatarChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const data = new FormData();
        data.append("avatar", e.target.files[0]);

        api.patch("/users/avatar", data).then((response) => {
          updateUser({
            ...user,
            avatar_url: response.data.avatar_url,
            current_balance: user.current_balance,
            formattedBalance: user.formattedBalance,
          });
          addToast({ type: "success", title: "updated avatar" });
        });
      }
    },
    [addToast, updateUser, user]
  );
  return (
    <Container>
      <header>
        <div>
          <ButtonBack mobileTitle="Profile" goTo="/dashboard" />
        </div>
      </header>
      <Content>
        <Form
          ref={formRef}
          initialData={{ name: user.name, email: user.email }}
          onSubmit={handleSubmit}
        >
          <AvatarInput>
            {/* <img src={user.avatar_url} alt={user.name} /> */}
            <Avatar
              src={user.avatar_url}
              name={user.name}
              fontSize={42}
              width={186}
              height={186}
              borderSize={5}
              borderColor="#53bf99"
              round
            />
            <label htmlFor="avatar">
              <FiCamera />

              <input type="file" id="avatar" onChange={handleAvatarChange} />
            </label>
          </AvatarInput>

          <h1>My profile</h1>

          <Input
            name="name"
            icon={FiUser}
            placeholder="Name"
            isLoading={loading}
          />
          <Input
            name="email"
            icon={FiMail}
            placeholder="E-mail"
            isDisabled={true}
            isLoading={loading}
          />

          <Input
            containerStyle={{ marginTop: "24px" }}
            name="old_password"
            icon={FiLock}
            type="password"
            placeholder="Password"
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
            Confirm changes
          </Button>

          <Link
            to="/"
            onClick={() => {
              // disconnectSocket();
              signOut();
            }}
          >
            <FiPower /> Logout
          </Link>
        </Form>
      </Content>
    </Container>
  );
};

export default Profile;
