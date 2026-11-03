/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
