import React, { useCallback, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import AsyncSelectCreatable from "../../../../components/AsyncSelectCreatable";
import Button from "../../../../components/Button";
import { CustomCheckbox } from "../../../../components/CustomCheckbox";
import Header from "../../../../components/Header";
import Input from "../../../../components/Input";
import { useToast } from "../../../../hooks/toast";
import api from "../../../../services/api";
import getValidationErrors from "../../../../utils/getValidationErrors";
import validateEmail from "../../../../utils/validateEmail";
import ListItem from "../../../ListItem";
import { IUser, IUser as IUserItem } from "../../types";
import { Container, ContentItem } from "../styles";

interface IInvitationUser {
  id: string;
  name: string;
  sync_id: string;
  label: string;
  firstName: string;
  email: string;
  __isNew__?: boolean;
}

const GroupAdmin: React.FC<React.PropsWithChildren<unknown>> = () => {
  // const [mentors, setMentors] = useState<IUserItem[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<IInvitationUser>();
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [asynctLoading, setAsyncLoading] = useState(false);

  const history = useHistory();
  const formRef = useRef<FormHandles>(null);
  const { idOrganization, idGroup, idRoom } = useParams<{
    idOrganization: string;
    idGroup: string;
    idRoom: string;
  }>();

  const { addToast } = useToast();

  const loadUsers = useCallback(async (value: any) => {
    if (value.length > 2) {
      try {
        // setAsyncLoading(true);
        const response = await api.get<IUserItem[]>("/users", {
          params: { name: value },
        });
        setAsyncLoading(false);
        return response.data.map((usu) => ({
          value: usu.sync_id,
          label: `${usu.name}`,
          firstName: usu.name.split(" ")[0],
          ...usu,
        }));
      } catch (err: any) {
        // setAsyncLoading(false);
        console.log(err);
      }
    }
  }, []);

  const handleChangeCheckBoxStatus = useCallback((name: string) => {
    if (formRef && formRef.current) {
      const currentvalue = formRef.current.getFieldValue(name);
      formRef.current.setFieldValue(name, !currentvalue);
    }
  }, []);

  const handleSubmit = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);
      try {
        if (!selectedAdmin) {
          return;
        }

        let formData = {
          user_syncid_add: selectedAdmin.sync_id,
          role: "admin",
        };

        if (selectedAdmin.__isNew__) {
          const response = await api.post(`/users/invite`, {
            email: selectedAdmin.email,
          });
          const { sync_id, email } = response.data;
          formData = {
            user_syncid_add: sync_id,
            role: "admin",
          };
        }

        await api.post(`/organizations/${idOrganization}/add-user`, formData);
        setSelectedAdmin(undefined);
        addToast({
          title: "Success",
          type: "success",
          description: selectedAdmin.__isNew__
            ? `Admin ${selectedAdmin.name} form has been invited`
            : `admin ${selectedAdmin.name} form has been added`,
        });
        history.push("/organizations");

        // setSelectedAdmin(undefined);
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Create group admin error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, idGroup, idRoom, idOrganization, selectedAdmin]
  );

  const handleInvite = useCallback(
    async (inputvalue: string) => {
      if (!validateEmail(inputvalue)) {
        formRef.current?.setFieldError(
          "invitation",
          "Invitation email is not valid"
        );
        addToast({
          type: "error",
          title: "ERROR",
          description: "Invitation email is not valid",
        });

        setSelectedAdmin(undefined);
        return;
      }

      setSelectedAdmin({
        id: uuid(),
        sync_id: uuid(),
        name: inputvalue,
        label: inputvalue,
        email: inputvalue,
        firstName: inputvalue,
        __isNew__: true,
      });
    },
    [addToast]
  );

  return (
    <Container>
      <Header
        goTo={`/organizations/${idOrganization}/edit`}
        mobileTitle="Add new admin"
        title="Add new admin"
      />

      <Form ref={formRef} onSubmit={handleSubmit}>
        <AsyncSelectCreatable
          name="invitation"
          type="avatar"
          margin="0 0 18px 0"
          onCreateOption={handleInvite}
          onChange={(value: any) =>
            value
              ? setSelectedAdmin({
                  id: value.id,
                  name: value.label,
                  firstName: value.firstName,
                  ...value,
                })
              : setSelectedAdmin(undefined)
          }
          isClearable
          value={selectedAdmin}
          disabled={loadingSubmit}
          isLoading={asynctLoading || loadingSubmit}
          formatCreateLabel={(value: string) => `Invitation: ${value}`}
          placeholder="Enter name or email"
          loadOptions={loadUsers}
        />

        <Button type="submit" isLoading={loadingSubmit}>
          Add new admin
        </Button>
      </Form>
    </Container>
  );
};

export default GroupAdmin;
