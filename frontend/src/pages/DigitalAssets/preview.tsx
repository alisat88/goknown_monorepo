import { format, parseISO } from "date-fns";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { useHistory, useLocation, useParams } from "react-router-dom";

import noAsset from "../../assets/noasset.svg";
import Asset, { AssetTypes } from "../../components/Asset";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import {
  Container,
  Content,
  Schedule,
  ContentPreviewAssets,
  InfoPreviewAssets,
  Flag,
  Section,
} from "./styles";

interface IDigitalAssetsItem {
  id: string;
  sync_id: string;
  asset_url: string;
  mimetype: AssetTypes;
  name: string;
  description?: string;
  privacy: "private" | "public";
  token: string;
  user_id: string;
  created_at: string;
}

interface ILocationsProps {
  oldPage?: string;
}

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

const DigitalAssetsPreview: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(true);
  const [digitalAsset, setDigitalAsset] = useState<IDigitalAssetsItem>(
    {} as IDigitalAssetsItem
  );
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  const { addToast } = useToast();
  const { user } = useAuth();

  const location = useLocation<ILocationsProps>();
  const { idGroup, idOrganization, idRoom } = useParams<IParams>();

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }
    return "";
  }, [idGroup, idOrganization, idRoom]);

  const handleGoTo = useCallback((to: string) => history.push(to), [history]);

  useEffect(() => {
    setLoading(true);
    api
      .get<IDigitalAssetsItem>(`/me/digitalassets/${id}`)
      .then((response) =>
        setDigitalAsset({
          ...response.data,
          created_at: format(
            parseISO(response.data.created_at),
            "M/d/yyyy h:mm a"
          ),
        })
      )
      .catch((err) =>
        addToast({
          title: "Error",
          type: "error",
          timeout: 3000,
          description: err.message,
        })
      )
      .finally(() => setLoading(false));
  }, [addToast, id]);

  return (
    <Container>
      <header>
        <div>
          <ButtonBack
            mobileTitle="Preview Asset"
            goTo={`${baseNavigationPath}/digitalassets`}
          />
          <Button
            color="primary"
            disabled={loading === false && user.id !== digitalAsset.user_id}
            onClick={() =>
              handleGoTo(
                `${baseNavigationPath}/digitalassets/${digitalAsset.sync_id}/edit`
              )
            }
          >
            <FiEdit2 /> Edit Asset
          </Button>
        </div>
      </header>
      <Content>
        <Schedule>
          <header style={{ marginTop: "-5rem" }}>
            <h1>{digitalAsset.name}</h1>
            <Button
              color="primary"
              disabled={loading === false && user.id !== digitalAsset.user_id}
              onClick={() =>
                handleGoTo(
                  `${baseNavigationPath}/digitalassets/${digitalAsset.sync_id}/edit`
                )
              }
            >
              <FiEdit2 /> Edit Asset
            </Button>
          </header>

          <Section>
            {!digitalAsset ? (
              <header>
                <img src={noAsset} alt="no transactions" />
                <p>No Asset found</p>
              </header>
            ) : (
              <ContentPreviewAssets>
                <div>
                  <Asset
                    component="preview"
                    url={digitalAsset.asset_url}
                    name={digitalAsset.name}
                    type={digitalAsset.mimetype}
                  />

                  <InfoPreviewAssets>
                    <h5>Details:</h5>

                    <div>
                      {!!digitalAsset.token && (
                        <span>NFT Token: {digitalAsset.token}</span>
                      )}
                      <div>
                        <p>{digitalAsset.created_at}</p>
                        <Flag color={digitalAsset.privacy ? "green" : "red"}>
                          <strong>{digitalAsset.privacy}</strong>
                        </Flag>
                      </div>
                    </div>

                    <h6>Asset Description: {digitalAsset.description}</h6>
                  </InfoPreviewAssets>
                </div>
              </ContentPreviewAssets>
            )}
          </Section>
        </Schedule>
      </Content>
    </Container>
  );
};

export default DigitalAssetsPreview;
