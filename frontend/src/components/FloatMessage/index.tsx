import React from "react";
import { FiMessageCircle } from "react-icons/fi";
import { useHistory } from "react-router-dom";

import { Container } from "./styles";

interface IFloatMessageProps {
  unread: number;
}

const FloatMessage: React.FC<React.PropsWithChildren<IFloatMessageProps>> = ({
  unread,
}) => {
  const history = useHistory();
  return (
    <Container onClick={() => history.push("/messenger")}>
      <FiMessageCircle size={42} strokeWidth={1} />
      {unread > 0 && <span>{unread}</span>}
    </Container>
  );
};

export default FloatMessage;
