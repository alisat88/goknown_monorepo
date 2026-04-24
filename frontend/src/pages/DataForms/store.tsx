import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { FaRegFolderOpen } from "react-icons/fa";
import { FiX } from "react-icons/fi";
// eslint-disable-next-line import/no-extraneous-dependencies
import { useHistory, useLocation, useParams } from "react-router";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import groupIcon from "../../assets/group.svg";
import AsyncSelect from "../../components/AsyncSelect";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import ButtonTransform from "../../components/ButtonTransform";
import { LoaderCarduser } from "../../components/ContentLoader";
import Input from "../../components/Input";
import TextArea from "../../components/TextArea";
import Toggle from "../../components/Toggle";
import { useAuth } from "../../hooks/auth";
import { useDialog } from "../../hooks/dialog";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Avatar } from "../../styles/global";
import getValidationErrors from "../../utils/getValidationErrors";
import {
  CardContent,
  CardUser,
  Container,
  Content,
  ToggleContent,
  ContentStore,
} from "./styles";

export interface IUserData {
  id: string;
  name: string;
  sync_id: string;
  email: string;
  firstName?: string;
  type?: "user" | "group";
  avatar_url: string;
}
export interface IFoldersItem {
  id: string;
  sync_id: string;
  name: string;
  user: IUserData;
  shared?: boolean;
  shared_users?: IUserData[];
  shared_groups?: IGroupData[];
}

interface IGroupData {
  id: string;
  sync_id: string;
  name: string;
}
interface IParticipantData {
  id: string;
  sync_id: string;
  firstName: string;
  name: string;
  avatar?: string;
  type?: "user" | "group";
}

interface IParams {
  id: string;
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

interface ILocationsProps {
  oldPage?: string;
}

export default function Folder() {
  const {
    id: dataFormId,
    idRoom,
    idOrganization,
    idGroup,
  } = useParams<IParams>();

  const { user } = useAuth();
  const [addUserMenuOpen, setAddUserMenuOpen] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<IFoldersItem>();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<IParticipantData>();

  const location = useLocation<ILocationsProps>();

  const goBackNavigation = useMemo(
    () => (location.state?.oldPage ? location.state.oldPage : `/dataforms`),
    [location.state]
  );

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/dataforms`;
    }

    return "/dataforms";
  }, [idGroup, idOrganization, idRoom]);

  useMemo(() => (idRoom ? setIsOn(true) : setIsOn(false)), [idRoom]);

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

  const { addToast } = useToast();
  const { showDialog } = useDialog();
  const history = useHistory();
  const formRef = useRef<FormHandles>(null);

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

  const handleSubmitFolder = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required(),
          description: Yup.string(),
          privacy: Yup.boolean().required(),
        });
        console.log(data);
        await schema.validate(data, { abortEarly: false });

        const formData = {
          name: data.name,
          privacy: data.privacy ? "private" : "public",
          description: data.description,
          room_syncid: idRoom,
          shared_groups_ids: participants
            .filter((participant) => participant.type === "group")
            .map((participant) => participant.sync_id),
        };

        const response = await api.post("/me/dataforms", formData);

        addToast({
          title: "Success",
          type: "success",
          description: "Your data form has been created",
        });

        history.push(
          idRoom
            ? `${baseNavigationPath}/${response.data.myDataForms.sync_id}/structure`
            : `/dataforms/${response.data.myDataForms.sync_id}/structure`,
          { oldPage: idRoom ? baseNavigationPath : null }
        );
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Create data form error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, baseNavigationPath, history, idRoom, participants]
  );

  const handleDelete = useCallback(
    (event: any) => {
      event.preventDefault();
      try {
        showDialog({
          icon: "question",
          title: `Remove ${selectedFolder?.name}`,
          text: `Are you sure you want to remove?`,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
          confirm: {
            function: () =>
              api
                .delete(`/me/folders/${selectedFolder?.sync_id}`)
                .then((response) => {
                  history.push(`/folder/${dataFormId}/preview`);
                }),
            showLoaderOnConfirm: true,
            errorMessage: "something didn't go right",
            successMessage:
              "<b>successful</b>, you will be redirected to the previous page",
            timeoutToClose: 3000,
          },
        });
      } catch (error: any) {
        addToast({
          type: "error",
          title: "Create folder error",
          timeout: 8000,
          description: error.response
            ? error.response.data.error
            : error.message,
        });
      }
    },
    [
      addToast,
      dataFormId,
      history,
      selectedFolder?.name,
      selectedFolder?.sync_id,
      showDialog,
    ]
  );

  // LOAD FOLDER
  useEffect(() => {
    if (dataFormId) {
      setLoadingSubmit(true);
      setParticipants([]);
      api
        .get<IFoldersItem>(`/me/folders/${dataFormId}`)
        .then((response) => {
          setSelectedFolder(response.data);
          formRef.current?.setData({ name: response.data.name });
          const loadeadUsers =
            (response.data.shared_users &&
              response.data.shared_users.map(
                (part) =>
                  ({
                    id: part.id,
                    sync_id: part.sync_id,
                    name: part.name,
                    type: "user",
                    firstName: part.name?.split(" ")[0],
                    avatar: part.avatar_url,
                  } as IParticipantData)
              )) ||
            [];

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
          setParticipants([...loadeadUsers, ...loadeadGroups]);
        })
        .catch((error) =>
          addToast({
            title: "Error",
            type: "error",
            timeout: 3000,
            description: error.message,
          })
        )
        .finally(() => setLoadingSubmit(false));
    }
  }, [addToast, dataFormId, user.id]);

  return (
    <Container mobileHeight={90} height={150}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={
              dataFormId ? `Edit Form ${selectedFolder?.name}` : "New Form"
            }
            goTo={goBackNavigation}
          />
          <h1>
            {dataFormId ? `Edit Form ${selectedFolder?.name}` : "New Form"}
          </h1>
        </div>
      </header>
      <ContentStore>
        <Form ref={formRef} onSubmit={handleSubmitFolder}>
          <Input
            name="name"
            placeholder="Form Name"
            isLoading={loadingSubmit}
          />

          <TextArea name="description" placeholder="Form Description" />

          <ToggleContent>
            <strong>Private:</strong>
            <Toggle name="privacy" isOn={isOn} onClick={() => setIsOn(!isOn)} />
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
                    onSubmit={(setExpand) => handleAddParticipants(setExpand)}
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
      </ContentStore>
    </Container>
  );
}
