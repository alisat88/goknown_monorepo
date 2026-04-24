import { ChangeEvent, useRef, useCallback, useState, useEffect } from "react";
import { FaRegFolderOpen } from "react-icons/fa";
import { FiCamera, FiEdit, FiPlus, FiTrash, FiX } from "react-icons/fi";
// eslint-disable-next-line import/no-extraneous-dependencies
import { useHistory, useParams } from "react-router";
import { Link } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { SelectComponent } from "../../components/AsyncSelectCreatable/styles";
import Button from "../../components/Button";
import Field from "../../components/Field";
import Header from "../../components/Header";
import Input from "../../components/Input";
import Toggle from "../../components/Toggle";
import UnControlledToggle from "../../components/Toggle/unControlled";
import { useDialog } from "../../hooks/dialog";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Avatar } from "../../styles/global";
import getValidationErrors from "../../utils/getValidationErrors";
import ListItem from "../ListItem";
import { ListItemActions, ListItemInfo } from "../ListItem/styles";
import { organizationsFake } from "./fakeData";
import {
  Container,
  ContentStore,
  AvatarInput,
  GroupAdmins,
  Message,
  Flag,
  Widget,
  WidgetContent,
} from "./styles";
import { IOrganizationItem } from "./types";

export default function EditOrganization() {
  const { idOrganization } = useParams<{ idOrganization: string }>();

  const [selectedOrganization, setSelectedOrganization] =
    useState<IOrganizationItem>();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<ChangeEvent<HTMLInputElement>>(
    {} as ChangeEvent<HTMLInputElement>
  );
  const [asyncLoading, setAsyncLoading] = useState(false);

  const { addToast } = useToast();
  const { showDialog } = useDialog();
  const history = useHistory();
  const formRef = useRef<FormHandles>(null);

  // LOAD Organization
  useEffect(() => {
    if (idOrganization) {
      setLoading(true);
      const organization = organizationsFake.find(
        (org) => org.sync_id === idOrganization
      );
      setSelectedOrganization(organization);

      api
        .get(`/organizations/${idOrganization}`)
        .then((response) => setSelectedOrganization(response.data))
        .catch((error) =>
          addToast({
            type: "error",
            title: "ERROR",
            description: error.response?.data?.error || error.message,
          })
        )
        .finally(() => setLoading(false));
    }
  }, [addToast, idOrganization]);

  const handleAvatarChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>, organization_sync_id?: string) => {
      if (e.target.files) {
        setAvatar(e);
      }
      if (e.target.files && (idOrganization || organization_sync_id)) {
        const data = new FormData();
        data.append("avatar", e.target.files[0]);

        const response = await api.patch<IOrganizationItem>(
          `/organizations/${idOrganization || organization_sync_id}/avatar`,
          data
        );

        setSelectedOrganization({
          ...selectedOrganization,
          ...response.data,
        });
        addToast({ type: "success", title: "updated avatar" });
      }
    },
    [addToast, idOrganization, selectedOrganization]
  );

  const handleSubmitOrganization = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required(),
          admin_alias: Yup.string(),
          enableWallet: Yup.bool(),
        });

        await schema.validate(data, { abortEarly: false });

        const formData = {
          name: data.name,
          admin_alias: data.admin_alias || "Group Admin",
          description: data.description,
          enable_wallet: data.enableWallet,
        };

        if (idOrganization) {
          const response = await api.put(
            `/organizations/${idOrganization}`,
            formData
          );

          setSelectedOrganization({
            ...selectedOrganization,
            ...response.data,
          });
          addToast({
            title: "Success",
            type: "success",
            description: "Your organization has been edited",
          });
        } else {
          const response = await api.post("/organizations", formData);
          if (!!avatar.target && !!avatar.target.files) {
            await handleAvatarChange(avatar, response.data?.sync_id);
          }
          history.push(`/organizations/${response.data?.sync_id}/edit`);
          addToast({
            title: "Success",
            type: "success",
            description: "Your organization has been created",
          });
        }
      } catch (err: any) {
        console.log(err);
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Create organization error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [
      addToast,
      avatar,
      handleAvatarChange,
      history,
      idOrganization,
      selectedOrganization,
    ]
  );

  const updateUserStatus = useCallback(
    async (user_syncid_edited: any, status: any) => {
      try {
        const state = status === "active" ? "inactive" : "active";

        const formData = {
          user_syncid_edited,
          status: state,
        };

        const response = await api.put(
          `organizations/${idOrganization}/switch-user`,
          formData
        );

        addToast({ type: "success", title: "Success" });
        if (selectedOrganization) {
          setSelectedOrganization({
            ...selectedOrganization,
            admins: selectedOrganization?.admins?.map((user) =>
              user.sync_id === user_syncid_edited
                ? { ...user, status: state }
                : user
            ),
          });
        }
      } catch (error) {
        console.log(error);
      }
    },
    [addToast, idOrganization, selectedOrganization]
  );

  const handleGoTo = useCallback(
    (to: string, oldPage?: string) => history.push(to, { oldPage }),
    [history]
  );

  const renderAdmins = useCallback(() => {
    return (
      <GroupAdmins>
        <header>
          <Field
            tag="h3"
            error="Group admin"
            loading={loading}
            value={`${selectedOrganization?.admin_alias}`}
            width={120}
            height={27}
          />

          <Button
            color="accent"
            isLoading={loadingSubmit}
            onClick={() =>
              handleGoTo(`/organizations/${idOrganization}/groupsadmins`)
            }
          >
            <FiPlus />
          </Button>
        </header>

        {!loading &&
          selectedOrganization &&
          selectedOrganization.admins &&
          selectedOrganization.admins.length === 0 && (
            <Message>
              <p>
                You do not have any {selectedOrganization.admin_alias} yet.{" "}
              </p>

              <p>
                <Link to={`/organizations/${idOrganization}/groupsadmins`}>
                  Click here
                </Link>
                to add.
              </p>
            </Message>
          )}
        {!loading &&
          selectedOrganization &&
          selectedOrganization.admins &&
          selectedOrganization.admins.map((admin) => (
            <ListItem key={admin.id} size="small">
              <Avatar
                src=""
                name={admin.name || "Pending"}
                width={40}
                height={40}
                round
              />
              <ListItemInfo>
                <h4>{admin.name}</h4>
                <span>{admin.email}</span>
              </ListItemInfo>

              <ListItemActions>
                <Flag
                  color={
                    admin.status === "active"
                      ? "green"
                      : admin.status === "pending"
                      ? "yellow"
                      : "grey"
                  }
                >
                  <strong>{admin.status}</strong>
                </Flag>

                <UnControlledToggle
                  style={{ marginLeft: "0.3rem !important" }}
                  name={`switch_user_${admin.sync_id}`}
                  isOn={admin.status !== "pending" && admin.status === "active"}
                  disabled={admin.status === "pending"}
                  onClick={() =>
                    admin.status === "pending"
                      ? {}
                      : updateUserStatus(admin.sync_id, admin.status)
                  }
                />
              </ListItemActions>
            </ListItem>
          ))}
      </GroupAdmins>
    );
  }, [
    handleGoTo,
    loading,
    loadingSubmit,
    idOrganization,
    selectedOrganization,
    showDialog,
  ]);

  return (
    <Container mobileHeight={90} height={150}>
      <Header
        loading={loading}
        goTo={"/organizations"}
        mobileTitle={
          idOrganization
            ? `Edit Org ${selectedOrganization?.name}`
            : "New Organization"
        }
        title={
          idOrganization
            ? `Edit Org ${selectedOrganization?.name}`
            : "New Organization"
        }
      />

      <ContentStore>
        <Form
          ref={formRef}
          onSubmit={handleSubmitOrganization}
          initialData={{
            name: selectedOrganization?.name,
            admin_alias: selectedOrganization?.admin_alias,
            enableWallet: selectedOrganization?.enableWallet,
          }}
        >
          <AvatarInput>
            {/* <img src={user.avatar_url} alt={user.name} /> */}
            <Avatar
              src={selectedOrganization?.avatar_url}
              name=""
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

          <Input
            name="name"
            placeholder="Name"
            label="Organization name"
            isLoading={loadingSubmit || loading}
          />
          <Input
            name="admin_alias"
            label="Admin alias"
            placeholder="Group Admin Alias"
            isLoading={loadingSubmit || loading}
          />

          <div className="dls_sections">
            <label>Organization Wallet</label>
            <Toggle
              // active={"true"}
              // inactive={data.switch_alias?.inactive}
              // showAlias={data.showAlias}
              // label={dl.name}

              isOn={selectedOrganization?.enableWallet || false}
              name="enableWallet"
            />
          </div>

          {idOrganization && renderAdmins()}

          <footer>
            <Button type="submit" isLoading={loadingSubmit || loading}>
              {idOrganization ? "SAVE CHANGES" : "CREATE ORGANIZATION"}
            </Button>
          </footer>
        </Form>
      </ContentStore>
    </Container>
  );
}
