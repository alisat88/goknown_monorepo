import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AiFillFolderOpen } from "react-icons/ai";
import { FiDatabase, FiFileText, FiPlus } from "react-icons/fi";
import { useParams, Link, useHistory, useLocation } from "react-router-dom";

import dataFormsIcon from "../../assets/dataforms.svg";
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
  Message,
} from "./styles";

interface IUserData {
  id: string;
  name: string;
  sync_id: string;
  email: string;
  avatar_url: string;
}

export interface IDataFormsItem {
  id: string;
  sync_id: string;
  name: string;
  privacy: "public" | "private";
  description?: string;
  owner: IUserData;
  isOwner: boolean;
  members: number;
}

export type IResponseDataForms = IDataFormsItem[];

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

interface ILocationsProps {
  oldPage?: string;
}

const DataForms: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [dataForms, setDataForms] = useState<IDataFormsItem[]>([]);

  const history = useHistory();
  const { idOrganization, idGroup, idRoom } = useParams<IParams>();

  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation<ILocationsProps>();

  // PT: /organizaitons/:idOrganization/groups/:idGroup/rooms/:idRoom
  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}/dataforms`;
    }
    window.history.replaceState({}, document.title);
    return "/dataforms";
  }, [idGroup, idOrganization, idRoom]);

  // PT: quando for fazer consulta na API
  useEffect(() => {
    console.log(location);

    setLoading(true);
    let url = "/me/dataforms";
    if (idOrganization && idGroup && idRoom) {
      url = baseNavigationPath;
    }
    api
      .get<IResponseDataForms>(url)
      .then((response) => {
        setDataForms(
          response.data.map((form) => ({
            ...form,
            isOwner: form.owner.sync_id === user.sync_id,
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
  }, [
    addToast,
    baseNavigationPath,
    idGroup,
    idOrganization,
    idRoom,
    location,
    user.sync_id,
  ]);

  const handleGoDataForm = useCallback(
    (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      to: string,
      dataFormSyncId: any
    ) => {
      e.stopPropagation();
      history.push(`${baseNavigationPath}/${dataFormSyncId}/${to}`, {
        oldPage: idRoom ? baseNavigationPath : "/dataforms",
      });
    },
    [baseNavigationPath, history, idRoom]
  );

  const handleGoTo = useCallback(
    (to: string) =>
      history.push(to, { oldPage: idRoom ? baseNavigationPath : null }),
    [baseNavigationPath, history, idRoom]
  );

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle="Data Forms"
            goTo={
              idRoom
                ? `${baseNavigationPath.replace("/dataforms", "/dashboard")}`
                : `/dashboard`
            }
          />

          <h1>Data Forms</h1>
        </div>
      </header>
      <Content>
        <Schedule>
          {loading && <ListItemLoader />}
          {!loading && dataForms.length === 0 && (
            <Message>
              <p>You do not have any forms yet. </p>

              <p>
                <Link to="dataforms/new">Click here</Link>to create your first
                form.
              </p>
            </Message>
          )}

          {!loading &&
            dataForms.map((dataForm) => (
              <FolderList
                key={dataForm.id}
                type={"private"}
                onClick={() =>
                  handleGoTo(`${baseNavigationPath}/${dataForm.sync_id}/edit`)
                }
                owner={dataForm.isOwner}
              >
                <div>
                  <img
                    src={dataFormsIcon}
                    alt="Group Icon"
                    style={{ width: 64 }}
                  />
                  <section>
                    <h4>{dataForm.name}</h4>
                    {/* <span>{group.members} Members</span> */}
                  </section>
                  <div className="flag-section">
                    <Flag color={dataForm.isOwner ? "green" : "blue"}>
                      <strong>{dataForm.isOwner ? "Owner" : "member"}</strong>
                    </Flag>
                    <Flag
                      color={dataForm.privacy === "public" ? "green" : "red"}
                    >
                      <strong>
                        {dataForm.privacy === "public" ? "Public" : "Private"}
                      </strong>
                    </Flag>
                  </div>
                  <div className="actions-section">
                    <button
                      onClick={(e) =>
                        handleGoDataForm(e, "collect", dataForm.sync_id)
                      }
                    >
                      <FiFileText />
                    </button>
                    <button
                      onClick={(e) =>
                        handleGoDataForm(e, "records", dataForm.sync_id)
                      }
                    >
                      <FiDatabase />
                    </button>
                  </div>
                </div>
              </FolderList>
            ))}
        </Schedule>
        <RigthSection>
          <section>
            <BigButton onClick={() => handleGoTo(`${baseNavigationPath}/new`)}>
              <FiPlus /> Create New Form
            </BigButton>
          </section>
        </RigthSection>
      </Content>

      <Footer>
        <Button
          color="accent"
          onClick={() => handleGoTo(`${baseNavigationPath}/new`)}
        >
          <FiPlus /> Create New Form
        </Button>
      </Footer>
    </Container>
  );
};

export default DataForms;
