/* eslint-disable import/no-extraneous-dependencies */
import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory, useParams } from "react-router";
import * as Yup from "yup";

import { FormHandles, Scope } from "@unform/core";
import { Form } from "@unform/web";

import AsyncSelect from "../../../components/AsyncSelect";
import Button from "../../../components/Button";
import Header from "../../../components/Header";
import Input from "../../../components/Input";
import Select from "../../../components/Select";
import Toggle from "../../../components/Toggle";
import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import getValidationErrors from "../../../utils/getValidationErrors";
import {
  IUser as IUserItem,
  IGroupItem,
  IOrganizationItem,
  IRoomItem,
  IDL,
} from "../types";
import { Container, ContentStore, DLsContent } from "./styles";

export default function EditGroup() {
  const { idOrganization } = useParams<{ idOrganization: string }>();
  const { idGroup } = useParams<{ idGroup: string }>();
  const { idRoom } = useParams<{ idRoom: string }>();

  const [loading, setLoading] = useState(false);
  const [loadingDLs, setLoadingDLs] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<IOrganizationItem>();
  const [selectedGroup, setSelectedGroup] = useState<IGroupItem>();
  const [selectedAdmin, setSelectedAdmin] = useState<IUserItem>();
  const [selectedRoom, setSelectedRoom] = useState<IRoomItem>();
  const [dls, setDLs] = useState<IDL[]>([]);
  const [admins, setAdmins] = useState<IUserItem[]>();
  const [asynctLoading, setAsyncLoading] = useState(false);

  const history = useHistory();
  const formRef = useRef<FormHandles>(null);

  const { addToast } = useToast();

  const handleSubmit = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);

      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required(),
          // admin_id: Yup.string(),
        });

        await schema.validate(data, { abortEarly: false });

        const selectedDLS = Object.keys(data.dls[0]).filter(
          (key, value) => data.dls[0][key] === true
        );

        const dls_syncids = dls
          .map((dl) =>
            selectedDLS.find((selected) => selected === dl.flag) === dl.flag
              ? dl.sync_id
              : null
          )
          .filter((value) => value !== null);

        const formData = {
          name: data.name,
          dls_syncids,
        };

        if (idRoom) {
          await api.put(
            `organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`,
            formData
          );

          addToast({ type: "success", title: `Room ${data.name} edited` });

          // history.push(`/organizations/${idOrganization}/groups`);
        } else {
          await api.post(
            `organizations/${idOrganization}/groups/${idGroup}/rooms`,
            formData
          );

          addToast({ type: "success", title: `Room ${data.name} created` });

          history.push(
            `/organizations/${idOrganization}/groups/${idGroup}/rooms`
          );
        }
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Create subgroup error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, dls, history, idGroup, idRoom, idOrganization]
  );

  useEffect(() => {
    if (idRoom) {
      setLoading(true);

      api
        .get(
          `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`
        )
        .then((response) => {
          console.log(response.data);
          setSelectedRoom(response.data);
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));

      // setSelectedGroup(group);
    }
  }, [idGroup, idRoom, idOrganization]);

  useEffect(() => {
    setLoadingDLs(true);
    api
      .get<IDL[]>("/dls")
      .then((response) =>
        setDLs(response.data.filter((dl) => dl.flag !== "wallet"))
      )
      .catch((error) => {})
      .finally(() => setLoadingDLs(false));
  }, []);

  const checkDLEnabled = useCallback(
    (flag: string) => !!selectedRoom?.dls.find((dl) => dl.flag === flag),
    [selectedRoom?.dls]
  );

  return (
    <Container>
      <Header
        height={150}
        goTo={`/organizations/${idOrganization}/groups/${idGroup}/rooms`}
        mobileTitle={idRoom ? `Edit ${selectedRoom?.name}` : "New Sub group"}
        title={idRoom ? `Edit ${selectedRoom?.name}` : "New sub Group"}
        loading={loading}
      />
      <ContentStore>
        <Form
          ref={formRef}
          onSubmit={handleSubmit}
          initialData={{ name: selectedRoom?.name }}
        >
          <Input
            name="name"
            placeholder="Room name"
            isLoading={loadingSubmit || loading}
          />
          {/* <Select
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
              isLoading={asynctLoading}
              placeholder="Enter name or email"
              options={admins}
            /> */}

          <DLsContent>
            <header>
              <h3>Apps</h3>
            </header>
            <Scope path="dls[0]">
              {!loadingDLs &&
                dls.map((dl) => (
                  <div className="dls_sections" key={dl.sync_id}>
                    <label>{dl.name}</label>
                    <Toggle
                      // active={"true"}
                      // inactive={data.switch_alias?.inactive}
                      // showAlias={data.showAlias}
                      // label={dl.name}
                      isOn={checkDLEnabled(dl.flag)}
                      name={dl.flag || ""}
                    />
                  </div>
                ))}
            </Scope>
          </DLsContent>
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
