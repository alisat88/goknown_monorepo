/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
