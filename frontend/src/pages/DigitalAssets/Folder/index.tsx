import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { FaRegFolderOpen } from "react-icons/fa";
import { FiX } from "react-icons/fi";
// eslint-disable-next-line import/no-extraneous-dependencies
import { useHistory, useParams } from "react-router";
import { useLocation } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import groupIcon from "../../../assets/group.svg";
import AsyncSelect from "../../../components/AsyncSelect";
import Button from "../../../components/Button";
import ButtonBack from "../../../components/ButtonBack";
import ButtonTransform from "../../../components/ButtonTransform";
import { LoaderCarduser } from "../../../components/ContentLoader";
import Input from "../../../components/Input";
import Toggle from "../../../components/Toggle";
import { useAuth } from "../../../hooks/auth";
import { useDialog } from "../../../hooks/dialog";
import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import { Avatar } from "../../../styles/global";
import getValidationErrors from "../../../utils/getValidationErrors";
import { ToggleContent } from "../styles";
import { CardContent, CardUser, Container, Content } from "./styles";

interface IUserData {
  id: string;
  name: string;
  sync_id: string;
  email: string;
  firstName?: string;
  type?: "user" | "group";
  avatar_url: string;
}
interface IFoldersItem {
  id: string;
  sync_id: string;
  name: string;
  user: IUserData;
  shared?: boolean;
  welcome?: boolean;
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

interface ILocationsProps {
  oldPage?: string;
}

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

export default function Folder() {
  const { id: folderId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [addUserMenuOpen, setAddUserMenuOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<IFoldersItem>();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [isWelcomeFolder, setIsWelcomeFolder] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<IParticipantData>();

  const location = useLocation<ILocationsProps>();
  const { idGroup, idOrganization, idRoom } = useParams<IParams>();

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

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }

    return "";
  }, [idGroup, idOrganization, idRoom]);

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

  const loadUsers = useCallback(async (value: any) => {
    if (value.length > 2) {
      try {
        // setAsyncLoading(true);
        const response = await api.get<IUserData[]>("/users", {
          params: { name: value },
        });

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

        const users = response.data.map((usu) => ({
          value: usu.sync_id,
          label: `${usu.name}`,
          firstName: usu.name.split(" ")[0],
          type: "user",
          ...usu,
        }));
        setAsyncLoading(false);
        return [...users, ...groups];
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
          welcome: Yup.boolean(),
        });

        await schema.validate(data, { abortEarly: false });

        const formData = {
          name: data.name,
          welcome: isWelcomeFolder,
          room_syncid: idRoom,
          shared_users_ids: participants
            .filter(
              (participant) =>
                participant.id !== user.id && participant.type === "user"
            )
            .map((participant) => participant.sync_id),
          shared_groups_ids: participants
            .filter((participant) => participant.type === "group")
            .map((participant) => participant.sync_id),
        };

        // if (isWelcomeFolder) {
        //   delete formData.shared_users_ids;
        //   delete formData.shared_groups_ids;
        // }
        console.log(formData);

        if (folderId) {
          await api.put(`/me/folders/${folderId}`, formData);

          addToast({
            title: "Success",
            type: "success",
            description: "Your folder has been edited",
          });

          history.push(`${baseNavigationPath}/folder/${folderId}/preview`);
        } else {
          await api.post("/me/folders", formData);

          addToast({
            title: "Success",
            type: "success",
            description: "Your folder has been created",
          });
        }
        if (folderId) {
          history.push(`${baseNavigationPath}/folder/${folderId}/preview`);
        } else {
          history.push(`${baseNavigationPath}/digitalassets`);
        }
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Create folder error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, participants, user.id, isWelcomeFolder]
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
                  history.push(`/folder/${folderId}/preview`);
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
      folderId,
      history,
      selectedFolder?.name,
      selectedFolder?.sync_id,
      showDialog,
    ]
  );

  // LOAD FOLDER
  useEffect(() => {
    if (folderId) {
      setLoadingSubmit(true);
      setParticipants([]);
      api
        .get<IFoldersItem>(`/me/folders/${folderId}`)
        .then((response) => {
          setSelectedFolder(response.data);
          // alert(response.data.welcome);
          setIsWelcomeFolder(response.data.welcome || false);
          formRef.current?.setData({
            name: response.data.name,
            welcome: response.data.welcome || false,
          });

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
          // addToast({
          //   title: "Error",
          //   type: "error",
          //   timeout: 3000,
          //   description: error.message,
          // })
          console.log(error)
        )
        .finally(() => setLoadingSubmit(false));
    }
  }, [addToast, folderId, user.id]);

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={
              folderId ? `Edit Folder ${selectedFolder?.name}` : "New Folder"
            }
            goTo={
              folderId
                ? `${baseNavigationPath}/folder/${folderId}/preview`
                : `${baseNavigationPath}/digitalassets`
            }
          />
          <h1>
            {folderId ? `Edit Folder ${selectedFolder?.name}` : "New Folder"}
          </h1>
        </div>
      </header>
      <Content>
        <Form ref={formRef} onSubmit={handleSubmitFolder}>
          <Input
            name="name"
            placeholder="Folder Name"
            icon={FaRegFolderOpen}
            isLoading={loadingSubmit}
          />
          {!idRoom && (
            <>
              {user.role === "admin" && (
                <>
                  <h3>Set folder to Welcome Folder</h3>
                  <ToggleContent>
                    <Toggle
                      name="welcome"
                      isOn={isWelcomeFolder}
                      onClick={() => setIsWelcomeFolder(!isWelcomeFolder)}
                    />
                  </ToggleContent>

                  {isWelcomeFolder && (
                    <span>
                      {" "}
                      The folder will be the first folder to be displayed on the
                      home page, and you can't add participants because all
                      users can see it.
                    </span>
                  )}
                </>
              )}

              {!isWelcomeFolder && (
                <>
                  <h3> Select a Partcipant</h3>
                  <section>
                    <div>
                      <ButtonTransform
                        onChangePanel={setAddUserMenuOpen}
                        hasValueToSubmit={!!selectedParticipant}
                        isLoading={loadingSubmit}
                        isDisabled={isWelcomeFolder}
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
                          placeholder="Partcipant"
                          loadOptions={loadUsers}
                        />
                      </ButtonTransform>

                      {loading && <LoaderCarduser />}
                      <CardContent isDisabled={isWelcomeFolder}>
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
            </>
          )}

          <footer>
            <Button
              type="submit"
              isLoading={loadingSubmit}
              disabled={addUserMenuOpen}
            >
              {folderId ? "EDIT FOLDER" : "CREATE FOLDER"}
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
      </Content>
    </Container>
  );
}
