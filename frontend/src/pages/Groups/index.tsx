import { group } from "console";
import React, { useCallback, useEffect, useState } from "react";
import { AiFillFolderOpen } from "react-icons/ai";
import { FiPlus } from "react-icons/fi";
import { useHistory, useLocation } from "react-router-dom";

import groupIcon from "../../assets/group.svg";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import ListItemLoader from "../../components/ContentLoader/LisItemLoader";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Footer } from "../../styles/global";
import {
  Container,
  Content,
  Schedule,
  Flag,
  RigthSection,
  BigButton,
  FolderList,
} from "./styles";

interface IUserData {
  id: string;
  name: string;
  sync_id: string;
  email: string;
  avatar_url: string;
}

interface IGroupsItem {
  id: string;
  sync_id: string;
  name: string;
  owner: IUserData;
  isOwner: boolean;
  members: number;
  description: string;
}

type IResponseGroups = IGroupsItem[];

const Groups: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<IGroupsItem[]>([]);

  const history = useHistory();

  const { user } = useAuth();
  const { addToast } = useToast();
  const handleGoTo = useCallback((to: string) => history.push(to), [history]);

  useEffect(() => {
    setLoading(true);
    api
      .get<IResponseGroups>("/me/groups")
      .then((response) => {
        setGroups(
          response.data.map((group) => ({
            ...group,
            isOwner: group.owner.sync_id === user.sync_id,
          }))
        );
      })
      .catch((err) =>
        addToast({
          title: "Error",
          type: "error",
          timeout: 3000,
          description: err.message,
        })
      )
      .finally(() => setLoading(false));
  }, [addToast, user.sync_id]);

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack mobileTitle="Groups" goTo={"/dashboard"} />
          <h1>Groups</h1>
        </div>
      </header>
      <Content>
        <Schedule>
          {loading && <ListItemLoader />}
          {!loading && groups.length === 0 && <p>You don't have groups</p>}

          {!loading &&
            groups.map((group) => (
              <FolderList
                key={group.id}
                type={"private"}
                onClick={() => handleGoTo(`/groups/${group.sync_id}/edit`)}
                owner={group.isOwner}
              >
                <div>
                  <img src={groupIcon} alt="Group Icon" />
                  <section>
                    <h4>{group.name}</h4>
                    <span>{group.members} Members</span>
                  </section>

                  <Flag color={group.isOwner ? "green" : "blue"}>
                    <strong>{group.isOwner ? "Owner" : "member"}</strong>
                  </Flag>
                </div>
              </FolderList>
            ))}
        </Schedule>
        <RigthSection>
          <section>
            <BigButton onClick={() => handleGoTo("/groups/new")}>
              <FiPlus /> New Group
            </BigButton>
          </section>
        </RigthSection>
      </Content>

      <Footer>
        <Button color="accent" onClick={() => handleGoTo(`/groups/new`)}>
          <FiPlus /> New Group
        </Button>
      </Footer>
    </Container>
  );
};

export default Groups;
