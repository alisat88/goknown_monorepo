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
