/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import React from "react";

import { Container, Content } from "./styles";

interface IListItemProps {
  size?: "normal" | "small";
  color?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?(): any;
}

const ListItem: React.FC<React.PropsWithChildren<IListItemProps>> = ({
  size = "normal",
  onClick,
  color,
  children,
  disabled,
}: IListItemProps) => {
  return (
    <Container onClick={onClick} disabled={disabled}>
      <Content size={size} color={color}>
        {children}
      </Content>
    </Container>
  );
};

export default ListItem;
