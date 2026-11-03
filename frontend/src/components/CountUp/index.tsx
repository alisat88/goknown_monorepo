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
  value: any;
}

const CountUp: React.FC<React.PropsWithChildren<IProps>> = ({ value }) => {
  return (
    <Container
      // decimal="."
      // separator=","
      // decimals={2}
      end={value}
      duration={2}
      preserveValue={true}
      delay={1}
    />
  );
};

export default CountUp;
