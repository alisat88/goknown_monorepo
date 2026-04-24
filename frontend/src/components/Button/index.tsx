import React, { ButtonHTMLAttributes } from "react";
import BounceLoader from "react-spinners/BounceLoader";

import { Container } from "./styles";

// no property needed so it was created a type instead of interface
type Buttonprops = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  color?: "primary" | "secondary" | "accent" | "red";
};

const Button: React.FC<React.PropsWithChildren<Buttonprops>> = ({
  children,
  isLoading,
  color = "primary",
  ...rest
}) => {
  return (
    <Container disabled={isLoading} color={color} {...rest}>
      {isLoading ? <BounceLoader size={32} color={"#bebebe"} /> : children}
    </Container>
  );
};

export default Button;
