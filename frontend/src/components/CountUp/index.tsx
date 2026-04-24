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
