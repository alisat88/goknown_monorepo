// eslint-disable-next-line import/no-duplicates
import { format } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import { enUS } from "date-fns/locale";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit, FiPlus } from "react-icons/fi";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
// eslint-disable-next-line import/no-duplicates
// eslint-disable-next-line import/no-duplicates

import Button from "../../../../components/Button";
import SmallLisItemLoader from "../../../../components/ContentLoader/SmallLisItemLoader";
import DLs from "../../../../components/DLs";
import Field from "../../../../components/Field";
import Header from "../../../../components/Header";
import UnControlledToggle from "../../../../components/Toggle/unControlled";
import { useToast } from "../../../../hooks/toast";
import api from "../../../../services/api";
import {
  Avatar,
  Footer,
  LeftSection,
  RightSection,
} from "../../../../styles/global";
import ListItem from "../../../ListItem";
import { Flag, Message } from "../../styles";
import { IDL, IGroupItem, IOrganizationItem, IRoomItem } from "../../types";
import {
  Container,
  Content,
  GroupAdmin,
  ListItemAction,
  ListItemInfo,
} from "./styles";

interface ILocationsProps {
  oldPage?: string;
}

const Dashboard: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(true);
  const [selectedOrganization, setSelectedOrganization] =
    useState<IOrganizationItem>();
  const [selectedGroup, setSelectedGroup] = useState<IGroupItem>();
  const [selectedDashoard, setSelectedDashboard] = useState<IRoomItem>();
  const [DLsList, setDLsList] = useState<IDL[]>();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const location = useLocation<ILocationsProps>();

  const history = useHistory();
  const { addToast } = useToast();
  const { idOrganization, idGroup, idRoom } = useParams<{
    idOrganization: string;
    idGroup: string;
    idRoom: string;
  }>();

  const selectedDateAsText = useMemo(() => {
    return format(selectedDate, "MMMM' ' dd',' y", {
      locale: enUS,
    });
  }, [selectedDate]);

  const handleGoTo = useCallback(
    (to: string, oldPage?: string) =>
      history.push(to, {
        oldPage:
          oldPage ||
          `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/dashboard`,
      }),
    [history, idGroup, idOrganization, idRoom]
  );

  useEffect(() => {
    if (idRoom) {
      setLoading(true);
      // const organization = organizationsFake[0];
      // setSelectedOrganization(organization);

      // const group = organization.groups
      //   ? organization.groups[0]
      //   : ({} as IGroupItem);

      // setSelectedGroup(group);

      // const room = group.rooms ? group.rooms[0] : ({} as IRoomItem);
      // setSelectedRoom(room);
      api
        .get(
          `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/dashboard`
        )
        .then((response) => {
          setSelectedDashboard(response.data);
          setDLsList([
            // {
            //   id: uuid(),
            //   flag: "wallet",
            //   icon: "wallet.svg",
            //   name: "Wallet",
            //   route: `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}transactions`,
            //   oldPage: `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/dashboard`,
            // },
            ...response.data.dls.map((dl: IDL) => ({
              ...dl,
              route: `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}${dl.route}`,
              oldPage: `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/dashboard`,
            })),
          ]);
          setSelectedOrganization(response.data.group.organization);
          setSelectedGroup(response.data.group);
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    }
  }, [idGroup, idRoom, idOrganization]);

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

  return (
    <Container>
      <Header
        height={220}
        goTo={
          location.state && location.state.oldPage
            ? location.state.oldPage
            : `/organizations/${idOrganization}/groups/${idGroup}/rooms`
        }
        mobileTitle={` ${selectedDashoard?.name} | Available Apps`}
        loading={loading}
        // title={`${selectedRoom?.name} | Available Apps`}
        title={`${selectedDashoard?.name} | Available Apps`}
      />

      <Content>
        <LeftSection>
          {/* {selectedDashoard && ( */}
          <DLs
            // title="Available Apps"
            subtitle={selectedDateAsText}
            dls={DLsList}
            loading={loading}
          />
          {/* )} */}

          <section>
            <header>
              <h3>Members</h3>
              <button
                onClick={() =>
                  handleGoTo(
                    `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/users`
                  )
                }
              >
                <FiEdit size={18} />
              </button>
            </header>
            {loading ? (
              <SmallLisItemLoader />
            ) : !!selectedDashoard?.members &&
              selectedDashoard?.members.length === 0 ? (
              <Message>
                <p>You do not have any members yet. </p>

                <p>
                  <Link
                    to={`/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/users`}
                  >
                    Click here
                  </Link>
                  to add.
                </p>
              </Message>
            ) : (
              selectedDashoard?.members?.map((roomUser) => (
                <ListItem
                  size="small"
                  key={roomUser.id}
                  disabled={roomUser.status === "pending"}
                >
                  <Avatar
                    width={40}
                    height={40}
                    round
                    name={roomUser.user.name || roomUser.user.email}
                    src={roomUser.user.avatar_url}
                  />
                  <ListItemInfo>
                    <h5>{roomUser.user.name}</h5>
                    <span>{roomUser.user.email}</span>
                  </ListItemInfo>
                  <Flag
                    color={
                      roomUser.status === "active"
                        ? "green"
                        : roomUser.status === "pending"
                        ? "yellow"
                        : "grey"
                    }
                  >
                    <strong>{roomUser.status}</strong>
                  </Flag>

                  <UnControlledToggle
                    style={{ marginLeft: "0.3rem !important" }}
                    name={`switch_user_${roomUser.user.sync_id}`}
                    isOn={roomUser.user.status === "active"}
                    onClick={() =>
                      updateUserStatus(
                        roomUser.user.sync_id,
                        roomUser.user.status
                      )
                    }
                  />

                  <ListItemAction animated={false}>
                    <button
                      onClick={() =>
                        handleGoTo(
                          `/organizations/${idOrganization}/groups/${idGroup}`
                        )
                      }
                    >
                      {/* <FiEdit size={18} /> */}
                    </button>
                  </ListItemAction>
                </ListItem>
              ))
            )}
          </section>
        </LeftSection>
        <RightSection>
          <GroupAdmin>
            <Field
              tag="h3"
              value={selectedOrganization?.admin_alias}
              loading={loading}
              width={150}
              theme="dark"
            />
            {loading && <Field loading={loading} value="loading" height={56} />}
            {!loading && selectedGroup && (
              <ListItem size="small" key={selectedGroup.admin.id}>
                <Avatar
                  width={40}
                  height={40}
                  round
                  name={selectedGroup.admin.name}
                  src={selectedGroup.admin.avatar_url}
                />
                <ListItemInfo>
                  <h5>{selectedGroup.admin.name}</h5>
                </ListItemInfo>
                <ListItemAction animated={false}>
                  <button
                    onClick={() =>
                      handleGoTo(
                        `/organizations/${idOrganization}/groups/${idGroup}/edit`,
                        `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/dashboard`
                      )
                    }
                  >
                    <FiEdit size={18} />
                  </button>
                </ListItemAction>
              </ListItem>
            )}
          </GroupAdmin>
        </RightSection>

        <Footer>
          <Button
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

export default Dashboard;
