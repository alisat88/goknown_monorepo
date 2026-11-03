/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import React from "react";

import ButtonBack from "../ButtonBack";
import Field from "../Field";
import { Container } from "./styles";

interface IHeaderProps {
  height?: number;
  mobileHeight?: number;
  goTo?: string;
  mobileTitle?: string;
  title?: string;
  loading?: boolean;
  theme?: "dark" | "light";
}

const Header: React.FC<React.PropsWithChildren<IHeaderProps>> = ({
  height = 150,
  mobileHeight = 90,
  goTo,
  mobileTitle,
  title,
  loading = false,
  theme = "dark",
}: IHeaderProps) => {
  return (
    <Container height={height} mobileHeight={mobileHeight}>
      <div>
        <ButtonBack mobileTitle={mobileTitle} goTo={goTo} loading={loading} />
        <Field
          loading={loading}
          tag="h1"
          value={title}
          width={300}
          theme={theme}
        />
      </div>
    </Container>
  );
};

export default Header;
