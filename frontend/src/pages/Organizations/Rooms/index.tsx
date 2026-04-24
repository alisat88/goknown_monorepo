import React, { useCallback, useEffect, useState } from "react";
import { FiArrowRight, FiChevronRight, FiEdit, FiPlus } from "react-icons/fi";
import { Link, useHistory, useParams } from "react-router-dom";

import BigButton from "../../../components/BigButton";
import Button from "../../../components/Button";
import SmallLisItemLoader from "../../../components/ContentLoader/SmallLisItemLoader";
import Field from "../../../components/Field";
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
import {
  Container,
  Content,
  GroupAdmin,
  ListItemAction,
  ListItemInfo,
} from "./styles";

const Groups: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] =
    useState<IOrganizationItem>();
  const [selectedGroup, setSelectedGroup] = useState<IGroupItem>();

  const history = useHistory();
  const { idOrganization } = useParams<{ idOrganization: string }>();
  const { idGroup } = useParams<{ idGroup: string }>();
  const { user } = useAuth();

  const handleGoTo = useCallback(
    (to: string, oldPage?: string) => history.push(to, { oldPage }),
    [history]
  );

  useEffect(() => {
    if (idOrganization && idGroup) {
      setLoading(true);

      api
        .get<IOrganizationItem>(`/organizations/${idOrganization}`)
        .then((response) => setSelectedOrganization(response.data))
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));

      api
        .get<IGroupItem>(
          `/organizations/${idOrganization}/groups/${idGroup}/rooms`
        )
        .then((response) => setSelectedGroup(response.data))
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    }
  }, [idGroup, idOrganization]);

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

  return (
    <Container>
      <Header
        height={200}
        goTo={`/organizations/${idOrganization}/groups`}
        mobileTitle={`Sub groups for ${selectedGroup?.name}`}
        title={`Sub groups for ${selectedGroup?.name}`}
        loading={loading}
      />

      <Content>
        <LeftSection>
          {loading && <SmallLisItemLoader />}
          {!loading && selectedGroup?.rooms?.length === 0 && (
            <Message>
              <p>You do not have any rooms yet. </p>

              <p>
                <Link
                  to={`/organizations/${idOrganization}/groups/${idGroup}/rooms/new`}
                >
                  Click here
                </Link>
                to create your first room.
              </p>
            </Message>
          )}

          {selectedGroup?.rooms?.map((room) => (
            <ListItem size="small" key={room.sync_id}>
              <Avatar
                size="32"
                round
                name={room.name}
                src=""
                onClick={() =>
                  handleGoTo(
                    `/organizations/${idOrganization}/groups/${idGroup}/rooms/${room.sync_id}/dashboard`
                  )
                }
              />
              <ListItemInfo
                onClick={() =>
                  handleGoTo(
                    `/organizations/${idOrganization}/groups/${idGroup}/rooms/${room.sync_id}/dashboard`
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
                      `/organizations/${idOrganization}/groups/${idGroup}/rooms/${room.sync_id}/edit`
                    )
                  }
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() =>
                    handleGoTo(
                      `/organizations/${idOrganization}/groups/${idGroup}/rooms/${room.sync_id}/dashboard`
                    )
                  }
                >
                  <FiChevronRight />
                </button>
              </ListItemAction>
            </ListItem>
          ))}
        </LeftSection>
        <RightSection>
          <section>
            <BigButton
              onClick={() =>
                handleGoTo(
                  `/organizations/${idOrganization}/groups/${idGroup}/rooms/new`
                )
              }
            >
              <FiPlus /> Create new sub group
            </BigButton>
          </section>

          <GroupAdmin>
            <h3>{selectedOrganization?.admin_alias}</h3>
            {loading ? (
              <Field loading={loading} value="loading" height={56} />
            ) : (
              selectedGroup && (
                <ListItem size="small">
                  <Avatar
                    width={36}
                    height={36}
                    round
                    name={selectedGroup.admin.name}
                    src={selectedGroup.admin.avatar_url}
                  />
                  <ListItemInfo>
                    <h5>{selectedGroup.admin.name}</h5>
                  </ListItemInfo>
                  <ListItemAction>
                    {canEdit(selectedGroup.admin.sync_id) && (
                      <button
                        onClick={() =>
                          handleGoTo(
                            `/organizations/${idOrganization}/groups/${idGroup}/edit`,
                            `/organizations/${idOrganization}/groups/${idGroup}/rooms`
                          )
                        }
                      >
                        <FiEdit size={18} />
                      </button>
                    )}
                  </ListItemAction>
                </ListItem>
              )
            )}
          </GroupAdmin>
        </RightSection>

        <Footer>
          <Button
            color="accent"
            onClick={() =>
              handleGoTo(
                `/organizations/${idOrganization}/groups/${idGroup}/rooms/new`
              )
            }
          >
            <FiPlus /> Create new sub group
          </Button>
        </Footer>
      </Content>
    </Container>
  );
};

export default Groups;
