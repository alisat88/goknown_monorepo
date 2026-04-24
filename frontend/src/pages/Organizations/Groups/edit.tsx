/* eslint-disable import/no-extraneous-dependencies */
import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import AsyncSelect from "../../../components/AsyncSelect";
import Button from "../../../components/Button";
import Header from "../../../components/Header";
import Input from "../../../components/Input";
import Select from "../../../components/Select";
import { useAuth } from "../../../hooks/auth";
import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import getValidationErrors from "../../../utils/getValidationErrors";
import { IUser as IUserItem, IGroupItem, IOrganizationItem } from "../types";
import { Container, Content, ContentStore } from "./styles";

interface ILocationsProps {
  oldPage?: string;
}

export default function EditGroup() {
  const { idOrganization } = useParams<{ idOrganization: string }>();
  const { idGroup } = useParams<{ idGroup: string }>();

  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<IOrganizationItem>();
  const [selectedGroup, setSelectedGroup] = useState<IGroupItem>();
  const [selectedAdmin, setSelectedAdmin] = useState<IUserItem>();
  const [admins, setAdmins] = useState<IUserItem[]>();
  const [asynctLoading, setAsyncLoading] = useState(false);

  const history = useHistory();
  const location = useLocation<ILocationsProps>();
  const formRef = useRef<FormHandles>(null);

  const { addToast } = useToast();
  const { user } = useAuth();

  const handleSubmit = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);
      if (!selectedAdmin) {
        addToast({
          type: "error",
          title: `${selectedOrganization?.admin_alias} can not be null`,
          timeout: 8000,
        });
        setLoadingSubmit(false);

        return;
      }
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required(),
          admin_id: Yup.string(),
        });

        await schema.validate(data, { abortEarly: false });

        const formData = {
          name: data.name,
          admin_id: selectedAdmin?.sync_id,
        };

        console.log(data);
        if (idGroup) {
          const response = await api.put(
            `organizations/${idOrganization}/groups/${idGroup}`,
            formData
          );

          addToast({ type: "success", title: `Group ${data.name} edited` });

          history.push(`/organizations/${idOrganization}/groups`);
        } else {
          const response = await api.post(
            `organizations/${idOrganization}/groups`,
            formData
          );

          addToast({ type: "success", title: `Group ${data.name} created` });

          history.push(`/organizations/${idOrganization}/groups`);
        }
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Create group error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [
      addToast,
      history,
      idGroup,
      idOrganization,
      selectedAdmin,
      selectedOrganization?.admin_alias,
    ]
  );

  useEffect(() => {
    if (idOrganization) {
      setLoading(true);
      api
        .get<IOrganizationItem>(`/organizations/${idOrganization}`)
        .then((response) => {
          setSelectedOrganization(response.data);

          if (
            !response.data.owners?.find(
              (owner) => owner.sync_id === user.sync_id
            )
          ) {
            setSelectedAdmin({
              value: user.sync_id,
              label: `You`,
              firstName: user.name.split(" ")[0],
              ...user,
            } as any);
          }
          const usersAdmins = (response.data?.admins || []).concat(
            response.data?.owners || []
          );
          setAdmins(
            // eslint-disable-next-line no-unsafe-optional-chaining
            usersAdmins.map((usu: IUserItem) => ({
              value: usu.sync_id,
              label: `${usu.name}`,
              firstName: usu.name.split(" ")[0],
              ...usu,
            }))
          );
        })
        .catch((error) =>
          addToast({
            type: "error",
            title: "ERROR",
            description: error.response?.data?.error || error.message,
          })
        )
        .finally(() => setLoading(false));
    }

    // setSelectedGroup(group);
  }, [addToast, idOrganization, user]);

  useEffect(() => {
    if (idGroup) {
      setLoading(true);
      api
        .get(`/organizations/${idOrganization}/groups/${idGroup}`)
        .then((response) => {
          setSelectedGroup(response.data);
          const { admin } = response.data;
          setSelectedAdmin({
            value: admin.sync_id,
            label: `${admin.name}`,
            firstName: admin.name.split(" ")[0],
            ...admin,
          });
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    }
  }, [idGroup, idOrganization]);

  return (
    <Container>
      <Header
        height={150}
        goTo={
          location.state && location.state.oldPage
            ? location.state.oldPage
            : `/organizations/${idOrganization}/groups`
        }
        mobileTitle={idGroup ? `Edit ${selectedGroup?.name}` : "New Group"}
        title={idGroup ? `Edit ${selectedGroup?.name}` : "New Group"}
        loading={loading}
        theme="dark"
      />
      <ContentStore>
        <Form
          ref={formRef}
          onSubmit={handleSubmit}
          initialData={{ name: selectedGroup?.name }}
        >
          <Input
            label="Sub group name"
            name="name"
            placeholder="Sub group name"
            isLoading={loadingSubmit || loading}
          />
          <Select
            // label={selectedOrganization?.admin_alias}
            name="admin"
            type="avatar"
            margin="0 0 18px 0"
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
            isLoading={asynctLoading || loadingSubmit || loading}
            placeholder="Enter name or email"
            options={admins}
          />
          <footer>
            <Button type="submit" isLoading={loadingSubmit || loading}>
              {idGroup ? "SAVE CHANGES" : "CREATE GROUP"}
            </Button>
          </footer>
        </Form>
      </ContentStore>
    </Container>
  );
}
