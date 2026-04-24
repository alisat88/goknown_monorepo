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
