import PDFViewer from "pdf-viewer-reactjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MdAudiotrack,
  MdImage,
  MdPictureAsPdf,
  MdVideocam,
} from "react-icons/md";
import Loader from "react-spinners/DotLoader";

import AudioVisualizer from "../AudioVisualizer";
import ImageLightbox from "../ImageLightbox";
import Pdf from "../Pdf/Pdf";
import { Container, LoadingContent } from "./styles";

export enum EnumAssetsType {
  "image/png" = "image",
  "image/jpeg" = "image",
  "image/jpg" = "image",
  "video/mpeg" = "video",
  "video/mp4" = "video",
  "audio/mpeg" = "audio",
  "audio/mp3" = "audio",
  "application/pdf" = "document",
}

export type AssetTypes = keyof typeof EnumAssetsType;

interface IProps {
  type: AssetTypes;
  url: string;
  name: string;
  onClick?(): void;
  component?: "preview" | "thumbnail";
}

const Asset: React.FC<React.PropsWithChildren<IProps>> = ({
  type,
  url,
  name,
  component = "thumbnail",
  onClick,
  ...rest
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (EnumAssetsType[type] !== "image") {
      setLoading(false);
    }
  }, [type]);

  const mountThumbnailAsset = useCallback(() => {
    switch (EnumAssetsType[type]) {
      case "image":
        return (
          <img
            src={url}
            alt={name}
            onLoad={async () => setTimeout(() => setLoading(false), 1500)}
          />
        );
      case "video":
        return <MdVideocam style={{ zIndex: 10 }} />;
      case "audio":
        return <MdAudiotrack style={{ zIndex: 10 }} />;
      case "document":
        return <MdPictureAsPdf style={{ zIndex: 10 }} />;
      default:
        return <MdImage style={{ zIndex: 10 }} />;
    }
  }, [name, type, url]);

  const mountPreviewAsset = useCallback(() => {
    switch (EnumAssetsType[type]) {
      case "image":
        // return <img src={url} alt={name} onLoad={async () => setTimeout(() =>setLoading(false),1500)}/>
        return <ImageLightbox url={url} alt={name} />;
      case "video":
        return (
          <video width="320" height="240" controls>
            <source src={url} type={type} />
          </video>
        );
      case "audio":
        return <AudioVisualizer url={url} type={type} />;
      case "document":
        return <Pdf url={url} />;
      default:
        return <MdImage style={{ zIndex: 10 }} />;
    }
  }, [name, type, url]);

  return (
    <Container isLoading={loading} className="Container" onClick={onClick}>
      <LoadingContent isLoading={loading}>
        <Loader color="grey" size={24} />
      </LoadingContent>

      {component === "preview" ? mountPreviewAsset() : mountThumbnailAsset()}
    </Container>
  );
};

export default Asset;
