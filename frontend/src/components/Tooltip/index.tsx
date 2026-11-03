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

interface ITooltipProps {
  title: string;
  className?: string;
}

const Tooltip: React.FC<React.PropsWithChildren<ITooltipProps>> = ({
  title,
  className = "",
  children,
}) => {
  return (
    <Container className={className}>
      {children}
      <span>{title}</span>
    </Container>
  );
};
export default Tooltip;
