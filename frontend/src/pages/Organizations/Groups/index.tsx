import React, { useCallback, useEffect, useState } from "react";
import {
  FiArrowRight,
  FiChevronRight,
  FiEdit,
  FiPenTool,
  FiPlus,
} from "react-icons/fi";
import { Link, useHistory, useParams } from "react-router-dom";

import BigButton from "../../../components/BigButton";
import Button from "../../../components/Button";
import ListItemLoader from "../../../components/ContentLoader/LisItemLoader";
import SmallLisItemLoader from "../../../components/ContentLoader/SmallLisItemLoader";
import Header from "../../../components/Header";
import { useAuth } from "../../../hooks/auth";
import api from "../../../services/api";
import {
  Avatar,
  Footer,
  LeftSection,
  RightSection,
} from "../../../styles/global";
import ListItem from "../../ListItem";
import { Message } from "../styles";
import { IGroupItem, IOrganizationItem } from "../types";
import { Container, Content, ListItemAction, ListItemInfo } from "./styles";

const Groups: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isOrganizationUser, setIsOrganizationUser] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<IOrganizationItem>();

  const history = useHistory();
  const { user } = useAuth();
  const { idOrganization } = useParams<{ idOrganization: string }>();

  const handleGoTo = useCallback(
    (to: string, oldPage?: string) => history.push(to, { oldPage }),
    [history]
  );

  // LOAD Organization
  useEffect(() => {
    if (idOrganization) {
      setLoading(true);

      api
        .get<IOrganizationItem>(`/organizations/${idOrganization}/groups`)
        .then((response) => {
          const groups = response.data.groups?.map((group) => ({
            ...group,
            rooms: group.rooms?.filter(
              (room) =>
                room.members?.find((member) => member.user_id === user.id)
                  ?.user_id === user.id
            ),
          })) as IGroupItem[];

          setSelectedOrganization({
            ...response.data,
            groups,
          });
          setIsOrganizationUser(
            !!response.data?.users?.find(
              (orgUser) => orgUser.sync_id === user.sync_id
            )
          );
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    }
  }, [idOrganization, user.id, user.sync_id]);

  const canEdit = useCallback(
    (admin_syncid: string) => {
      if (!selectedOrganization) {
        return false;
      }
      return (
        admin_syncid === user.sync_id ||
        !!selectedOrganization.owners?.find(
          (owner) => owner.sync_id === user.sync_id
        )
      );
    },
    [selectedOrganization, user.sync_id]
  );

  const renderUserView = useCallback(() => {
    if (!selectedOrganization) {
      return <></>;
    }
    if (
      (!loading && selectedOrganization.groups?.length === 0) ||
      !selectedOrganization.groups
    ) {
      return (
        <Message>
          <p>
            You do not have any rooms yet. Please contact{" "}
            {selectedOrganization.admin_alias}{" "}
          </p>
        </Message>
      );
    }

    if (selectedOrganization.groups?.length > 0) {
      return selectedOrganization.groups?.map((group) =>
        group.rooms?.map((room) => (
          <ListItem size="small" key={room.sync_id}>
            <Avatar
              size="32"
              round
              name={room.name}
              src=""
              onClick={() =>
                handleGoTo(
                  `/organizations/${idOrganization}/groups/${group.sync_id}/rooms/${room.sync_id}/dashboard`,
                  `/organizations/${idOrganization}/groups/`
                )
              }
            />
            <ListItemInfo
              onClick={() =>
                handleGoTo(
                  `/organizations/${idOrganization}/groups/${group.sync_id}/rooms/${room.sync_id}/dashboard`,
                  `/organizations/${idOrganization}/groups/`
                )
              }
            >
              <h4>{room.name}</h4>
              {/* <span>20 Users</span> */}
            </ListItemInfo>
            <ListItemAction>
              <button
                onClick={() =>
                  handleGoTo(
                    `/organizations/${idOrganization}/groups/${group.sync_id}/rooms/${room.sync_id}/dashboard`,
                    `/organizations/${idOrganization}/groups/`
                  )
                }
              >
                <FiChevronRight />
              </button>
            </ListItemAction>
          </ListItem>
        ))
      );
    }

    return <></>;
  }, [handleGoTo, idOrganization, loading, selectedOrganization]);

  const rederAdminView = useCallback(() => {
    return (
      <>
        {!loading && selectedOrganization?.groups?.length === 0 && (
          <Message>
            <p>You do not have any groups yet. </p>

            <p>
              <Link to={`/organizations/${idOrganization}/groups/new`}>
                Click here
              </Link>
              to create your first group.
            </p>
          </Message>
        )}
        {selectedOrganization?.groups?.map((group) => (
          <ListItem size="small" key={group.id}>
            <Avatar
              size="32"
              round
              name={group.name}
              src=""
              onClick={() =>
                handleGoTo(
                  `/organizations/${idOrganization}/groups/${group.sync_id}/rooms`
                )
              }
            />
            <ListItemInfo
              onClick={() =>
                handleGoTo(
                  `/organizations/${idOrganization}/groups/${group.sync_id}/rooms`
                )
              }
            >
              <h4>{group.name}</h4>
              <span>
                {selectedOrganization.admin_alias}:{group.admin.name}
              </span>
            </ListItemInfo>
            <ListItemAction>
              {canEdit(group.admin.sync_id) && (
                <button
                  onClick={() =>
                    handleGoTo(
                      `/organizations/${idOrganization}/groups/${group.sync_id}/edit`
                    )
                  }
                >
                  <FiEdit />
                </button>
              )}
              <button
                onClick={() =>
                  handleGoTo(
                    `/organizations/${idOrganization}/groups/${group.sync_id}/rooms`
                  )
                }
              >
                <FiChevronRight />
              </button>
            </ListItemAction>
          </ListItem>
        ))}
      </>
    );
  }, [canEdit, handleGoTo, idOrganization, loading, selectedOrganization]);

  return (
    <Container>
      <Header
        height={200}
        goTo={`/organizations/`}
        mobileTitle={`Groups for ${selectedOrganization?.name}`}
        title={`Groups for ${selectedOrganization?.name}`}
        loading={loading}
      />

      <Content>
        <LeftSection>
          {loading && <SmallLisItemLoader />}

          {isOrganizationUser ? renderUserView() : rederAdminView()}
        </LeftSection>
        <RightSection>
          <section>
            <BigButton
              disabled={isOrganizationUser}
              onClick={() =>
                handleGoTo(`/organizations/${idOrganization}/groups/new`)
              }
            >
              <FiPlus /> Create New group
            </BigButton>
          </section>
        </RightSection>

        <Footer>
          <Button
            disabled={isOrganizationUser}
            color="accent"
            onClick={() =>
              handleGoTo(`/organizations/${idOrganization}/groups/new`)
            }
          >
            <FiPlus /> Create new group
          </Button>
        </Footer>
      </Content>
    </Container>
  );
};

export default Groups;
