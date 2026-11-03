/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
