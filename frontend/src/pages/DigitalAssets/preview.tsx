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
  PreservationStatus,
  Section,
} from "./styles";

interface IDigitalAssetsItem {
  id: string;
  sync_id: string;
  asset_url: string;
  display_url?: string;
  mimetype: AssetTypes;
  display_mimetype?: AssetTypes;
  media_processing_status?:
    | "none"
    | "queued"
    | "processing"
    | "ready"
    | "failed";
  media_derivative_prefix?: string | null;
  name: string;
  description?: string;
  privacy: "private" | "public";
  token: string;
  user_id: string;
  created_at: string;
}

type PreservationStatusType = "processing" | "ready" | "failed";

interface IPreservationMessage {
  status: PreservationStatusType;
  title: string;
  description: string;
}

const getPreservationMessage = (
  digitalAsset: IDigitalAssetsItem
): IPreservationMessage | null => {
  const status = digitalAsset.media_processing_status;
  const mimetype = String(digitalAsset.mimetype || "").toLowerCase();

  const isJpeg = mimetype === "image/jpeg" || mimetype === "image/jpg";
  const isMp3 = mimetype === "audio/mpeg" || mimetype === "audio/mp3";
  const isMp4 = mimetype === "video/mp4";
  const isMov = mimetype === "video/quicktime" || mimetype === "video/mov";
  const isSupported = isJpeg || isMp3 || isMp4 || isMov;

  if (!isSupported || !status || status === "none") {
    return null;
  }

  if (status === "queued" || status === "processing") {
    return {
      status: "processing",
      title: "Creating preservation copy…",
      description:
        "Your original file has been retained while preservation processing completes.",
    };
  }

  if (status === "failed") {
    return {
      status: "failed",
      title: "Preservation processing failed",
      description:
        "The original file was retained, but the preservation copy could not be created.",
    };
  }

  if (status !== "ready") {
    return null;
  }

  if (
    (isMp4 || isMov) &&
    digitalAsset.media_derivative_prefix?.endsWith("/frames")
  ) {
    return null;
  }

  if (isJpeg) {
    return {
      status: "ready",
      title: "Preservation complete",
      description: "PNG preservation copy created. Original JPEG retained.",
    };
  }

  if (isMp3) {
    return {
      status: "ready",
      title: "Preservation complete",
      description:
        "FLAC preservation copy created. Original MP3 retained for playback.",
    };
  }

  if (isMp4) {
    return {
      status: "ready",
      title: "Preservation complete",
      description:
        "Lossless preservation master created. Original MP4 retained; optimized MP4 created for playback.",
    };
  }

  return {
    status: "ready",
    title: "Preservation complete",
    description:
      "Lossless preservation master created. Original MOV retained; optimized MP4 created for playback.",
  };
};

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

  useEffect(() => {
    const status = digitalAsset.media_processing_status;

    if (status !== "queued" && status !== "processing") {
      return undefined;
    }

    const interval = window.setInterval(() => {
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
        .catch(() => undefined);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [digitalAsset.media_processing_status, id]);

  const preservationMessage = getPreservationMessage(digitalAsset);

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
                    url={digitalAsset.display_url || digitalAsset.asset_url}
                    name={digitalAsset.name}
                    type={
                      digitalAsset.display_mimetype || digitalAsset.mimetype
                    }
                  />

                  {preservationMessage && (
                    <PreservationStatus status={preservationMessage.status}>
                      <div>
                        <strong>{preservationMessage.title}</strong>
                        <span>{preservationMessage.description}</span>
                      </div>
                    </PreservationStatus>
                  )}

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
