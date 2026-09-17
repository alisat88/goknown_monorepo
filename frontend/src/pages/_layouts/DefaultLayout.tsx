import React, { useCallback } from "react";
import { useLocation } from "react-router-dom";

import FloatMessage from "../../components/FloatMessage";
import { useAuth } from "../../hooks/auth";
import useMessengerUnread from "../../hooks/messengerUnread";
import { Wrapper } from "./styles";

const DefaultLayout: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  // const { conversations, setConversations } = useState(
  //   [] as ConversationItem[]
  // );
  const { user } = useAuth();
  const { pathname } = useLocation();
  useMessengerUnread();

  const renderButton = useCallback(() => {
    return ![
      "/",
      "/dashboard",
      "/messenger",
      "/signup",
      "/forgot-password",
      "/auditlogs",
      "/users",
      "/formbuilder",
      "/privacy-policy",
    ].includes(pathname) ? (
      <FloatMessage unread={user ? user.unread : 0} />
    ) : (
      <></>
    );
  }, [pathname, user]);

  return (
    <Wrapper>
      {children}

      {renderButton()}
    </Wrapper>
  );
};

export default DefaultLayout;
