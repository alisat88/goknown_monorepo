import { useRef, useCallback, useState, useEffect } from "react";
import { FaRegFolderOpen } from "react-icons/fa";
import { FiUser, FiX } from "react-icons/fi";
// eslint-disable-next-line import/no-extraneous-dependencies
import { useHistory, useLocation, useParams } from "react-router";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import AsyncSelect from "../../components/AsyncSelect";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import ButtonTransform from "../../components/ButtonTransform";
import { LoaderCarduser } from "../../components/ContentLoader";
import Input from "../../components/Input";
import TextArea from "../../components/TextArea";
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
  Owner,
  ContentStore,
} from "./styles";

interface IUserData {
  id: string;
  name: string;
  sync_id: string;
  email: string;
  firstName?: string;
  avatar_url: string;
}
interface IGroupsItem {
  id: string;
  sync_id: string;
  name: string;
  description: string;
  owner: IUserData;
  members: number;
  shared_users?: IUserData[];
}

interface ILocationsProps {
  folderId?: string;
  oldPage?: string;
}

export default function GroupStore() {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [addUserMenuOpen, setAddUserMenuOpen] = useState(false);
  const [expandComponent, setExpandComponent] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<IGroupsItem>();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<IUserData>();
  const [participants, setParticipants] = useState<IUserData[]>(() => {
    if (user) {
      return [
        {
          id: user.id,
          sync_id: user.sync_id,
          name: user.name,
          firstName: "You",
          avatar_url: user.avatar_url,
          email: user.email,
        } as IUserData,
      ];
    }
    return [] as IUserData[];
  });

  const { addToast } = useToast();
  const { showDialog } = useDialog();
  const history = useHistory();
  const location = useLocation<ILocationsProps>();
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

  const handleSubmitGroup = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required(),
          description: Yup.string(),
        });

        await schema.validate(data, { abortEarly: false });

        const formData = {
          name: data.name,
          description: data.description,
          shared_users_ids: participants
            .filter((participant) => participant.id !== user.id)
            .map((participant) => participant.sync_id),
        };
        if (groupId) {
          await api.put(`/me/groups/${groupId}`, formData);

          addToast({
            title: "Success",
            type: "success",
            description: "Your group has been edited",
          });
        } else {
          await api.post("/me/groups", formData);

          addToast({
            title: "Success",
            type: "success",
            description: "Your groups has been created",
          });
        }

        history.push(
          location.state?.oldPage ? location.state.oldPage : "/groups"
        );
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
    [addToast, groupId, history, participants, user.id]
  );

  const handleDelete = useCallback(
    (event: any) => {
      event.preventDefault();
      try {
        showDialog({
          icon: "question",
          title: `Remove ${selectedGroup?.name}`,
          text: `Are you sure you want to remove?`,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
          confirm: {
            function: () =>
              api
                .delete(`/me/groups/${selectedGroup?.sync_id}`)
                .then((response) => {
                  history.push("/groups");
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
          title: "delete group error",
          timeout: 8000,
          description: error.response
            ? error.response.data.error
            : error.message,
        });
      }
    },
    [addToast, history, selectedGroup?.name, selectedGroup?.sync_id, showDialog]
  );

  const renderOwner = useCallback(
    () => (
      <Owner>
        <p>OWNER</p>

        <span>
          <FiUser size={24} />

          {selectedGroup?.owner
            ? selectedGroup.owner.sync_id !== user.sync_id
              ? selectedGroup.owner.name
              : "You"
            : "You"}
        </span>
      </Owner>
    ),
    [selectedGroup, user.sync_id]
  );

  // LOAD Group
  useEffect(() => {
    if (groupId) {
      setLoadingSubmit(true);
      setParticipants([]);
      api
        .get<IGroupsItem>(`/me/groups/${groupId}`)
        .then((response) => {
          setSelectedGroup(response.data);
          formRef.current?.setData({
            name: response.data.name,
            description: response.data.description,
          });
          const loadeadParticipantes =
            (response.data.shared_users &&
              response.data.shared_users.map(
                (part) =>
                  ({
                    id: part.id,
                    sync_id: part.sync_id,
                    name: part.name,
                    firstName: part.name?.split(" ")[0],
                    avatar_url: part.avatar_url,
                    email: part.email,
                  } as IUserData)
              )) ||
            [];
          setParticipants([...loadeadParticipantes]);
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
  }, [addToast, groupId, user.id]);

  return (
    <Container mobileHeight={90} height={150}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={
              groupId ? `Edit Group ${selectedGroup?.name}` : "New Group"
            }
            goTo={location.state?.oldPage ? location.state.oldPage : "/groups"}
          />
          <h1>{groupId ? `Edit Group ${selectedGroup?.name}` : "New Group"}</h1>
        </div>
      </header>
      <ContentStore>
        <Form ref={formRef} onSubmit={handleSubmitGroup}>
          <Input
            name="name"
            label="Sub group name"
            placeholder="Sub group name"
            icon={FaRegFolderOpen}
            isLoading={loadingSubmit}
          />

          <h3> Select a Partcipant</h3>
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
                          email: value.email,
                          firstName: value.firstName,
                          avatar_url: value.avatar_url,
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
              <CardContent>
                {!loading &&
                  !!participants &&
                  participants.map((participant) => (
                    <CardUser key={participant.id} blurred={addUserMenuOpen}>
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
                        src={participant.avatar_url}
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

          <TextArea name="description" placeholder="Group Description" />

          {renderOwner()}

          <footer>
            <Button
              type="submit"
              isLoading={loadingSubmit}
              disabled={addUserMenuOpen}
            >
              {groupId ? "EDIT GROUP" : "CREATE GROUP"}
            </Button>
            {/* {groupId && (
              <Button
                color="red"
                isLoading={loadingSubmit}
                disabled={addUserMenuOpen}
                onClick={(event) => handleDelete(event)}
              >
                DELETE GROUP
              </Button>
            )} */}
          </footer>
        </Form>
      </ContentStore>
    </Container>
  );
}
