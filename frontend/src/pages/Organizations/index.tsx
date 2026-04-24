import React, { useCallback, useEffect, useState } from "react";
import { FiChevronRight, FiEdit, FiPlus } from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";

import organizationIcon from "../../assets/organizations.svg";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import ListItemLoader from "../../components/ContentLoader/LisItemLoader";
import { useDialog } from "../../hooks/dialog";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Avatar, Footer } from "../../styles/global";
import ListItem from "../ListItem";
import { ListItemAction } from "../ListItem/styles";
import {
  BigButton,
  Container,
  Content,
  Flag,
  Message,
  OrganizationList,
  RigthSection,
  Schedule,
} from "./styles";
import { IOrganizationItem, IOrganizationUserItem } from "./types";

const Organizations: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOriganizations] = useState<IOrganizationUserItem[]>(
    []
  );

  const history = useHistory();
  const { addToast } = useToast();
  const { showDialog } = useDialog();

  const handleGoTo = useCallback(
    (to: string, oldPage?: string) => history.push(to, { oldPage }),
    [history]
  );

  useEffect(() => {
    api
      .get<IOrganizationUserItem[]>("/organizations")
      .then((response) => setOriganizations(response.data))
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = useCallback(
    (organization: IOrganizationItem, event: any) => {
      event.preventDefault();
      try {
        showDialog({
          icon: "question",
          title: `Accept invitation `,
          html: `Are you sure you want to accept <b>${organization.name}</b> invitation`,
          confirmButtonText: "Yes",
          cancelButtonText: "Cancel",
          confirm: {
            function: () =>
              api
                .put(`/organizations/${organization.sync_id}/accept-invite`)
                .then((response) => {
                  setOriganizations(
                    organizations.map((org) =>
                      organization.id === org.organization_id
                        ? {
                            ...org,
                            status: "active",
                          }
                        : org
                    )
                  );
                }),
            showLoaderOnConfirm: true,
            errorMessage: "something didn't go right",
            successMessage: "<b>successful</b>",
            timeoutToClose: 2000,
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
    [addToast, history, organizations, showDialog]
  );

  const handleDecline = useCallback(
    (organization: IOrganizationItem, event: any) => {
      event.preventDefault();
      try {
        showDialog({
          icon: "warning",
          title: `Decline invitation `,
          html: `Are you sure you want to decline <b>${organization.name}</b> invitation`,
          confirmButtonText: "Yes",
          cancelButtonText: "Cancel",
          confirm: {
            function: () =>
              api
                .put(`/organizations/${organization.sync_id}/decline-invite`)
                .then((response) => {
                  setOriganizations(
                    organizations.filter(
                      (org) => org.organization.sync_id !== organization.sync_id
                    )
                  );
                }),
            showLoaderOnConfirm: true,
            errorMessage: "something didn't go right",
            successMessage: "<b>successful</b>",
            timeoutToClose: 2000,
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
    [addToast, organizations, showDialog]
  );

  const renderInvitation = useCallback(
    (organizationUser: IOrganizationUserItem) => {
      return (
        <div className="invitation-section">
          <Button
            color="accent"
            onClick={(event) =>
              handleAccept(organizationUser.organization, event)
            }
          >
            Accept
          </Button>
          <Button
            color="red"
            onClick={(event) =>
              handleDecline(organizationUser.organization, event)
            }
          >
            Decline
          </Button>
        </div>
      );
    },
    [handleAccept, handleDecline]
  );

  const renderEditButton = useCallback(
    (owner: boolean, organization_syncid: string) => {
      return owner ? (
        <button
          onClick={(e) =>
            // handleGoDataForm(e, "collect", organization.sync_id)
            handleGoTo(`/organizations/${organization_syncid}/edit`)
          }
        >
          <FiEdit />
        </button>
      ) : (
        <></>
      );
    },
    [handleGoTo]
  );

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack mobileTitle="Organizations" goTo={"/dashboard"} />
          <h1>Organizations</h1>
        </div>
      </header>
      <Content>
        <Schedule>
          {loading && <ListItemLoader />}
          {!loading && organizations.length === 0 && (
            <Message>
              <p>You do not belong to any organization yet. </p>

              <p>
                <Link to="organizations/new">Click here</Link>to create your
                first organization.
              </p>
            </Message>
          )}

          {!loading &&
            organizations.map((organizationUser) => (
              <ListItem key={organizationUser.id}>
                <Avatar
                  size="32"
                  src={
                    organizationUser.organization.avatar_url || organizationIcon
                  }
                  round
                  name={organizationUser.organization.name}
                />

                <section
                  onClick={() =>
                    organizationUser.status === "pending"
                      ? {}
                      : handleGoTo(
                          `/organizations/${organizationUser.organization.sync_id}/groups`
                        )
                  }
                >
                  <h4>{organizationUser.organization.name}</h4>
                </section>

                <>
                  {organizationUser.status === "pending" ? (
                    renderInvitation(organizationUser)
                  ) : (
                    <ListItemAction>
                      <Flag
                        color={
                          organizationUser.role === "owner" ? "green" : "blue"
                        }
                      >
                        <strong>
                          {organizationUser.role === "owner"
                            ? "Owner"
                            : organizationUser.role === "admin"
                            ? "Admin"
                            : "member"}
                        </strong>
                      </Flag>

                      {renderEditButton(
                        organizationUser.role === "owner",
                        organizationUser.organization.sync_id
                      )}
                      <button
                        onClick={() =>
                          handleGoTo(
                            `/organizations/${organizationUser.organization.sync_id}/groups`
                          )
                        }
                      >
                        <FiChevronRight />
                      </button>
                    </ListItemAction>
                  )}
                </>
              </ListItem>
            ))}
        </Schedule>
        <RigthSection>
          <section>
            <BigButton onClick={() => handleGoTo("/organizations/new")}>
              <FiPlus /> Create New Org
            </BigButton>
          </section>
        </RigthSection>
      </Content>

      <Footer>
        <Button color="accent" onClick={() => handleGoTo(`/organizations/new`)}>
          <FiPlus /> Create New Organization
        </Button>
      </Footer>
    </Container>
  );
};

export default Organizations;
