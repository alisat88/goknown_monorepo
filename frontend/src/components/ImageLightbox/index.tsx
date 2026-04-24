import React from "react";
import ModalImage from "react-modal-image";

import { Container } from "./styles";

interface IProps {
  url: string;
  alt: string;
}

const ImageLightbox: React.FC<React.PropsWithChildren<IProps>> = ({
  url,
  alt,
}) => {
  return (
    <Container>
      <ModalImage className="modalImage" small={url} large={url} alt={alt} />
    </Container>
  );
};

export default ImageLightbox;
