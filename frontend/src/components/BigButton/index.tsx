/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import React from "react";

import { Container } from "./styles";

interface IProps {
  onClick?(): void;
  disabled?: boolean;
  children: React.ReactNode;
}

const BigButton: React.FC<React.PropsWithChildren<IProps>> = ({
  onClick,
  children,
  disabled = false,
}: IProps) => {
  return (
    <Container onClick={disabled ? () => {} : onClick} disabled={disabled}>
      {children}
    </Container>
  );
};

export default BigButton;
