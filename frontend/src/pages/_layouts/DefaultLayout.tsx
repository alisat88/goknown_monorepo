import { count } from "console";
import React, { useEffect, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";

import FloatMessage from "../../components/FloatMessage";
import { useAuth } from "../../hooks/auth";
import { useSocket } from "../../hooks/socket";
import { Wrapper } from "./styles";

const DefaultLayout: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  // const { conversations, setConversations } = useState(
  //   [] as ConversationItem[]
  // );
  const { socket } = useSocket();
  const { user, updateUser } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (user && user.sync_id) {
      socket.emit("addUser", user.sync_id);
      return () => {
        socket.off("addUser");
      };
    }
  }, [socket, user]);

  useEffect(() => {
    if (user && user.sync_id) {
      socket.on("newMessage", ({ conversation_id, receiver_id }) => {
        // if (receiver_id === user.sync_id) {
        console.log(receiver_id === user.sync_id);
        const updateConversation = {
          ...user.conversations,
          [conversation_id]:
            !!user.conversations && user.conversations[conversation_id]
              ? user.conversations[conversation_id] + 1
              : 1,
        };
        updateUser({
          ...user,
          unread: user.unread ? user.unread + 1 : 1,
          conversations: updateConversation,
        });
        // }
      });
      return () => {
        socket.off("newMessage");
      };
    }
    return () => {
      socket.off("newMessage");
    };
  }, [socket, updateUser, user]);

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
