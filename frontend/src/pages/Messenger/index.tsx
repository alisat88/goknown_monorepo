import { formatDistance, parseISO, parse } from "date-fns";
import React, {
  LiHTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Avatar from "react-avatar";
import { FiSend } from "react-icons/fi";
import { useLocation, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import * as Yup from "yup";

import { FormHandles, SubmitHandler } from "@unform/core";
import { Form } from "@unform/web";

import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import UserLoader from "../../components/ContentLoader/UserLoader";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import { useSocket } from "../../hooks/socket";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";
import { Container, Content, ChatContent, Users, Messages } from "./styles";
// import { useSocket } from "../../hooks/socket";

interface IMessageItem {
  _id: string;
  text: string;
  sender: string;
  created_at: string | Date;
}

interface IConversationItem {
  sync_id: string;
  members: string[];
  created_at: string;
}

interface IUserSocketItem {
  usersync_id: string;
  socket_id: string;
}

interface IUserItem {
  id: string;
  sync_id: string;
  avatar_url: string;
  online: boolean;
  name: string;
  email: string;
  news: number;
  conversation: IConversationItem;
  messages?: IMessageItem[];
}

// const socket = io("http://localhost:3333");
// socket.on("connect", () => console.log("IO connect new connection"));

export default function Messenger() {
  // const [message, setMessage] = useState("");

  // const [messages, setMessages] = useState([] as MessageItem[]);
  const [users, setUsers] = useState([] as IUserItem[]);
  const [onlineUsers, setOnlineUsers] = useState([] as IUserSocketItem[]);
  const [currentChat, setCurrentChat] = useState({} as IUserItem);
  // const [socket, setSocket] = useState<Socket>();
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [arrivalMessage, setArrivalMessage] = useState({} as IMessageItem);

  const formRef = useRef<FormHandles>(null);
  const scrollRef = useRef<HTMLLIElement>(null);
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();

  interface ILocationsProps {
    oldPage: string;
  }

  interface IParams {
    idOrganization: string;
    idGroup: string;
    idRoom: string;
  }

  const { idOrganization, idGroup, idRoom } = useParams<IParams>();

  const location = useLocation<ILocationsProps>();
  // const { socket } = useSocket();

  /**
   * USE EFFECT
   */

  useEffect(() => {
    // socket.current = io("https://node1.dappgenius.app", { path: "/socket.io" });
    // socket.current = io("http://127.0.0.1:3333", { path: "/socket.io" });
    socket.on("getMessage", (data) => {
      setArrivalMessage({
        _id: uuid(),
        text: data.text,
        sender: data.sender,
        created_at: new Date().toISOString(),
      });
    });
    return () => {
      setArrivalMessage({} as IMessageItem);
      socket.off("getMessage");
    };
  }, [currentChat, socket]);

  useEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    !!arrivalMessage &&
      currentChat.conversation?.members?.includes(arrivalMessage.sender) &&
      setCurrentChat((prev) => ({
        ...prev,
        messages: prev.messages
          ? [...prev.messages, arrivalMessage]
          : [arrivalMessage],
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivalMessage]);

  useEffect(() => {
    socket.on("getUsers", (socketUsers: IUserSocketItem[]) => {
      // console.log("getUsers", socketUsers);
      setOnlineUsers(socketUsers);
      setUsers((prev) =>
        prev.sort((a, b) => (a.online as any) - (b.online as any))
      );
    });
    return () => {
      socket.off("getUsers");
    };
  }, [socket, user.sync_id]);

  useEffect(() => {
    socket.emit("addUser", user.sync_id);
    return () => {
      socket.off("addUser");
    };
  }, [socket, user.sync_id]);

  useEffect(() => {
    setLoading(true);
    api
      .get<IUserItem[]>("/conversations", { params: { room_id: idRoom } })
      .then((response) =>
        setUsers(response.data.filter((u) => u.sync_id !== user.sync_id))
      )
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, [user.sync_id]);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({
          behavior: "smooth",
          inline: "end",
          block: "end",
        });
      }
    }, 150);
  }, [currentChat]);

  /**
   * CALLBACK FUCTIONS
   */

  function array_move(arr: any[], old_index: number, new_index: number) {
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
  }

  const handleFormSubmit: SubmitHandler<IMessageItem> = useCallback(
    async (data, { reset }) => {
      setLoadingSubmit(true);
      try {
        const schema = Yup.object().shape({
          text: Yup.string().required(),
        });

        await schema.validate(data, { abortEarly: false });
        const { text } = data;

        if (text.trim() && currentChat) {
          // alert(unread);
          const response = await api.post<IMessageItem>(
            `/conversations/${currentChat.conversation.sync_id}/messages`,
            { text }
          );

          socket.emit("sendMessage", {
            sender: user.sync_id,
            conversation_id: currentChat.conversation.sync_id,
            receiver_id: currentChat.conversation.members.find(
              (member) => member !== user.sync_id
            ),
            text,
          });
          console.log(text);

          const currentIndex = users.findIndex(
            (u) =>
              u.sync_id ===
              currentChat.conversation.members.find(
                (member) => member !== user.sync_id
              )
          );

          setUsers(array_move(users, currentIndex, 0));

          setCurrentChat((prev) => ({
            ...prev,
            messages: prev.messages
              ? [...prev.messages, response.data]
              : [response.data],
          }));

          // scrollRef.current?.scrollIntoView({ behavior: "smooth" });
          reset();
        }
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }
      } finally {
        setLoadingSubmit(false);
        if (formRef.current) {
          const nameInput = formRef.current.getFieldRef("text");
          nameInput.focus();
        }
      }
    },
    [currentChat, socket, user.sync_id, users]
  );

  const handleSelectedUserChat = useCallback(
    async (receiver: IUserItem) => {
      setLoadingMessages(true);
      let conversation_id =
        !!receiver.conversation && receiver.conversation.sync_id
          ? receiver.conversation.sync_id
          : null;
      try {
        if (!conversation_id) {
          const response = await api.post(`/conversations`, {
            receiver_id: receiver.sync_id,
          });
          conversation_id = response.data.sync_id;
          setCurrentChat({ ...receiver, conversation: response.data });

          const responseMessages = await api.get<IMessageItem[]>(
            `/conversations/${conversation_id}/messages`
          );
          setCurrentChat({
            ...receiver,
            conversation: response.data,
            messages: responseMessages.data,
          });
        } else {
          const response = await api.get<IMessageItem[]>(
            `/conversations/${conversation_id}/messages`
          );

          if (user.conversations && user.conversations[conversation_id]) {
            const unReadChatMessages: number = user.conversations[
              conversation_id
            ]
              ? user.conversations[conversation_id]
              : 0;
            delete user.conversations[conversation_id];

            const newUnreadCount: number = user.unread - unReadChatMessages;

            updateUser({
              ...user,
              unread: newUnreadCount < 0 ? 0 : newUnreadCount,
              conversations: user.conversations,
            });
          }

          setCurrentChat({
            ...receiver,
            messages: response.data,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [updateUser, user]
  );

  const humanizeTime = (date: any) => {
    return formatDistance(parseISO(date), new Date(), { addSuffix: true });
  };

  const renderOnline = useCallback(
    (user: any) => {
      return onlineUsers.find((u) => u.usersync_id === user.sync_id) ? (
        <b />
      ) : (
        <></>
      );
    },
    [onlineUsers]
  );

  const renderUnreadConversations = useCallback(
    (chatUser: any) => {
      return (
        user.conversations &&
        chatUser.conversation &&
        user.conversations[chatUser.conversation.sync_id] > 0 && (
          <span className="number">
            {user.conversations[chatUser.conversation.sync_id]}
          </span>
        )
      );
    },
    [user.conversations]
  );

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack mobileTitle="Messenger" goTo="dashboard" />
          <h1>Online Chat</h1>
        </div>
      </header>
      <Content>
        <ChatContent>
          <Users>
            {loading && <UserLoader />}
            {!loading &&
              users.map((chatUser, index) => (
                <li
                  key={index}
                  className={
                    !!currentChat && chatUser.sync_id === currentChat.sync_id
                      ? "active"
                      : ""
                  }
                  onClick={() => handleSelectedUserChat(chatUser)}
                >
                  <Avatar
                    name={chatUser.name}
                    src={chatUser.avatar_url}
                    round
                    size="34"
                    maxInitials={2}
                  />
                  {renderOnline(chatUser)}

                  <h4>
                    {chatUser.name} {renderUnreadConversations(chatUser)}
                  </h4>
                </li>
              ))}
          </Users>

          <Messages>
            {currentChat.id ? (
              <>
                <header>
                  <Avatar
                    name={currentChat.name}
                    src={currentChat.avatar_url}
                    round
                    size="48"
                    maxInitials={2}
                  />
                  <h2>{currentChat.name}</h2>
                </header>

                <ul>
                  {!loadingMessages &&
                    !!currentChat.messages &&
                    currentChat.messages.length > 0 &&
                    currentChat.messages.map((m, index) => (
                      <li
                        ref={scrollRef}
                        className={`list__item list__item--${
                          m.sender === user.sync_id ? "mine" : "other"
                        }`}
                        key={index}
                      >
                        <div
                          className={`message message--${
                            m.sender === user.sync_id ? "mine" : "other"
                          }`}
                        >
                          <p>{m.text}</p>
                          <strong>{humanizeTime(m.created_at)}</strong>
                        </div>
                      </li>
                    ))}
                </ul>

                <Form ref={formRef} onSubmit={handleFormSubmit}>
                  <Input
                    autoFocus
                    name="text"
                    placeholder="Type a new message here"
                    type="text"
                    isLoading={loadingSubmit}
                  />
                  <Button type="submit" isLoading={loadingSubmit}>
                    <FiSend />
                  </Button>
                </Form>
              </>
            ) : (
              <p className="message">Open a conversation to start a chat</p>
            )}
          </Messages>
        </ChatContent>
      </Content>
    </Container>
  );
}
