import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { FiDatabase, FiFileText, FiPenTool, FiX } from "react-icons/fi";
import { useHistory, useLocation, useParams } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import groupIcon from "../../assets/group.svg";
import AsyncSelect from "../../components/AsyncSelect";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import ButtonTransform from "../../components/ButtonTransform";
import { LoaderCarduser } from "../../components/ContentLoader";
import Field from "../../components/Field";
import Input from "../../components/Input";
import TextArea from "../../components/TextArea";
import Toggle from "../../components/Toggle";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Avatar, Footer } from "../../styles/global";
import getValidationErrors from "../../utils/getValidationErrors";
import {
  Container,
  Content,
  RigthSection,
  ContentEdit,
  ToggleContent,
  CardContent,
  CardUser,
  BigButton,
} from "./styles";

// interface ILocationsProps {
//   dataFormId?: string;
// }

interface IParticipantData {
  id: string;
  sync_id: string;
  firstName: string;
  name: string;
  avatar?: string;
  type?: "user" | "group";
}

interface IGroupData {
  id: string;
  sync_id: string;
  name: string;
}

interface IDataFormItem {
  name: string;
  user_syncid: string;
  description?: string;
  privacy: "public" | "private";
  shared_groups?: IGroupData[];
  sync_id: string;
}

interface IGroupData {
  id: string;
  sync_id: string;
  name: string;
}

interface ILocationsProps {
  oldPage?: string;
}

export default function FormStructure() {
  // hooks
  const { user } = useAuth();
  const formRef = useRef<FormHandles>(null);
  const history = useHistory();
  const {
    id: dataFormId,
    idRoom,
    idOrganization,
    idGroup,
  } = useParams<{
    id: string;
    idOrganization: string;
    idGroup: string;
    idRoom: string;
  }>();
  const { addToast } = useToast();

  // states
  const [isOn, setIsOn] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [addUserMenuOpen, setAddUserMenuOpen] = useState(false);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [dataForm, setDataForm] = useState({} as IDataFormItem);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<IParticipantData>();
  const [participants, setParticipants] = useState<IParticipantData[]>(() => {
    if (user) {
      return [
        {
          id: user.id,
          sync_id: user.sync_id,
          name: user.name,
          firstName: "You",
          type: "user",
          avatar: user.avatar_url,
        } as IParticipantData,
      ];
    }
    return [] as IParticipantData[];
  });

  const location = useLocation<ILocationsProps>();

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/dataforms`;
    }

    return "/dataforms";
  }, [idGroup, idOrganization, idRoom]);

  const loadGroups = useCallback(async (value: any) => {
    if (value.length > 2) {
      try {
        // setAsyncLoading(true);
        // const response = await api.get<IUserData[]>("/users", {
        //   params: { name: value },
        // });

        const responseGroup = await api.get<IGroupData[]>("/me/groups", {
          params: { name: value },
        });
        const groups = responseGroup.data.map((group) => ({
          value: group.sync_id,
          label: `${group.name}`,
          firstName: group.name.split(" ")[0],
          type: "group",
          avatar_url: groupIcon,
          sync_id: group.sync_id,
        }));

        // const users = response.data.map((usu) => ({
        //   value: usu.sync_id,
        //   label: `${usu.name}`,
        //   firstName: usu.name.split(" ")[0],
        //   type: "user",
        //   ...usu,
        // }));
        setAsyncLoading(false);
        // return [...users, ...groups];
        return groups;
      } catch (err: any) {
        // setAsyncLoading(false);
        console.log(err);
      }
    }
  }, []);

  // const handleSubmit = useCallback(async () => {
  //   setLoadingSubmit(true);

  //   try {
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     setLoadingSubmit(false);
  //   }
  // }, []);

  const handleGoTo = useCallback(
    (to: string, oldPage?: string) =>
      history.push(`${baseNavigationPath}/${to}`, {
        oldPage: oldPage || `${baseNavigationPath}/${dataFormId}/edit`,
      }),
    [baseNavigationPath, dataFormId, history]
  );

  const handleAddParticipants = useCallback(
    (setExpand: any) => {
      if (selectedParticipant) {
        setParticipants([...participants, selectedParticipant]);
      }

      setSelectedParticipant(undefined);
      setExpand(false);
      setAddUserMenuOpen(false);
    },
    [participants, selectedParticipant]
  );

  const handleEditDataForm = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required(),
          description: Yup.string(),
          privacy: Yup.boolean().required(),
        });

        await schema.validate(data, { abortEarly: false });

        const formData = {
          name: data.name,
          privacy: data.privacy ? "private" : "public",
          description: data.description,
          shared_groups_ids: participants
            .filter((participant) => participant.type === "group")
            .map((participant) => participant.sync_id),
        };

        await api.put(`/me/dataforms/${dataFormId}`, formData);

        addToast({
          title: "Success",
          type: "success",
          description: "Your data form has been edited",
        });
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Create form error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, dataFormId, participants]
  );

  useEffect(() => {
    api
      .get<IDataFormItem>(`/me/dataforms/${dataFormId}`)
      .then((response) => {
        setDataForm(response.data);
        setIsOn(response.data.privacy !== "public");
        const loadeadGroups =
          (response.data.shared_groups &&
            response.data.shared_groups.map(
              (part) =>
                ({
                  id: part.id,
                  sync_id: part.sync_id,
                  name: part.name,
                  type: "group",
                  firstName: part.name?.split(" ")[0],
                  avatar: groupIcon,
                } as IParticipantData)
            )) ||
          [];
        setParticipants(loadeadGroups);
      })
      .catch((error: any) =>
        addToast({
          type: "error",
          title: "Error",
          description: error.message || "Error",
        })
      )
      .finally(() => setLoading(false));
  }, [addToast, dataFormId, history]);

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={`Edit ${dataForm?.name}`}
            goTo={idRoom ? baseNavigationPath : `/dataforms`}
          />
          <Field
            loading={loading}
            tag="h1"
            value={dataForm?.name}
            width={300}
            height={50}
          />
        </div>
      </header>

      <Content>
        <ContentEdit>
          {!loading && (
            <Form
              initialData={{
                name: dataForm.name,
                description: dataForm.description,
              }}
              ref={formRef}
              onSubmit={handleEditDataForm}
            >
              <Input
                name="name"
                placeholder="Form Name"
                isLoading={loadingSubmit}
              />

              <TextArea name="description" placeholder="Form Description" />
              <ToggleContent>
                <strong>Private:</strong>
                <Toggle
                  name="privacy"
                  isOn={isOn}
                  onClick={() => setIsOn(!isOn)}
                />
              </ToggleContent>
              {!idRoom && (
                <>
                  <h3> Add to a group</h3>
                  <section>
                    <div>
                      <ButtonTransform
                        onChangePanel={setAddUserMenuOpen}
                        hasValueToSubmit={!!selectedParticipant}
                        isLoading={loadingSubmit}
                        onSubmit={(setExpand) =>
                          handleAddParticipants(setExpand)
                        }
                      >
                        <AsyncSelect
                          name="partcipant"
                          type="avatar"
                          onChange={(value: any) =>
                            value
                              ? setSelectedParticipant({
                                  id: value.id,
                                  sync_id: value.sync_id,
                                  name: value.label,
                                  firstName: value.firstName,
                                  type: value.type,
                                  avatar: value.avatar_url,
                                })
                              : setSelectedParticipant(undefined)
                          }
                          isClearable
                          isLoading={asyncLoading}
                          placeholder="Groups"
                          loadOptions={loadGroups}
                        />
                      </ButtonTransform>

                      {loading && <LoaderCarduser />}
                      <CardContent>
                        {!loading &&
                          !!participants &&
                          participants.map((participant) => (
                            <CardUser
                              key={participant.id}
                              blurred={addUserMenuOpen}
                            >
                              {participant.id !== user.id && (
                                <button
                                  onClick={(event) => {
                                    event.preventDefault();
                                    setParticipants(
                                      participants.filter(
                                        (part) => part.id !== participant.id
                                      )
                                    );
                                  }}
                                >
                                  <FiX />
                                </button>
                              )}
                              <Avatar
                                name={participant.name}
                                src={participant.avatar}
                                width={46}
                                height={46}
                                round
                              />
                              <strong>{participant.firstName}</strong>
                            </CardUser>
                          ))}
                      </CardContent>
                    </div>
                  </section>
                </>
              )}
              <footer>
                <Button
                  type="submit"
                  isLoading={loadingSubmit}
                  disabled={addUserMenuOpen}
                >
                  {dataFormId ? "SAVE FORM" : "CREATE FORM"}
                </Button>
                {/* {folderId && (
              <Button
                color="red"
                isLoading={loadingSubmit}
                disabled={addUserMenuOpen}
                onClick={(event) => handleDelete(event)}
              >
                DELETE FOLDER
              </Button>
            )} */}
              </footer>
            </Form>
          )}
        </ContentEdit>
        <RigthSection>
          <section>
            <BigButton
              onClick={() => handleGoTo(`${dataFormId}/collect`)}
              style={{ marginRight: "1rem" }}
            >
              <FiFileText /> View Form
            </BigButton>
            <BigButton onClick={() => handleGoTo(`${dataFormId}/records`)}>
              <FiDatabase /> View Records
            </BigButton>
          </section>
          <section>
            <BigButton
              color="blue"
              onClick={() => handleGoTo(`${dataFormId}/structure`)}
              style={{ marginRight: "1rem" }}
            >
              <FiPenTool /> Edit Form
            </BigButton>
          </section>
        </RigthSection>
      </Content>

      <Footer>
        <Button
          color="accent"
          onClick={() => handleGoTo(`${dataFormId}/collect`)}
        >
          <FiFileText /> View Form
        </Button>

        <Button
          color="accent"
          onClick={() => handleGoTo(`${dataFormId}/records`)}
        >
          <FiDatabase /> View Records
        </Button>

        <Button
          color="primary"
          onClick={() => handleGoTo(`${dataFormId}/structure`)}
        >
          <FiPenTool /> Edit Form
        </Button>
      </Footer>
    </Container>
  );
}
