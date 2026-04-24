import React, { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "react-avatar";
import { useLocation, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import * as Yup from "yup";

import { FormHandles, SubmitHandler } from "@unform/core";
import { Form } from "@unform/web";
// import io from "socket.io-client";

import ButtonBack from "../../components/ButtonBack";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";
import { IRoomItem } from "../Organizations/types";
import { Container, Content, ChatContent, Users, Messages } from "./styles";

interface IMessageItem {
  id: string;
  message: string;
  from_user_syncid: string;
  to_user_syncid: string;
}

interface IUserItem {
  id: string;
  sync_id: string;
  avatar_url: string;
  name: string;
  email: string;
  messages?: IMessageItem[];
}

interface IChatItem {
  to: IUserItem;
  messages?: IMessageItem[];
}

// const socket = io("http://localhost:3333");
// socket.on("connect", () => console.log("IO connect new connection"));

interface ILocationsProps {
  oldPage: string;
}

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

export default function Chat() {
  // const [message, setMessage] = useState("");

  // const [messages, setMessages] = useState([] as MessageItem[]);
  const [users, setUsers] = useState([] as IUserItem[]);
  const [selectedUserChat, setSelectedUserChat] = useState({} as IChatItem);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const formRef = useRef<FormHandles>(null);
  const { user } = useAuth();
  const { idOrganization, idGroup, idRoom } = useParams<IParams>();

  const location = useLocation<ILocationsProps>();

  const receivedNewMessage = useCallback(
    (newMessage: IMessageItem) => {
      setSelectedUserChat({
        ...selectedUserChat,
        messages:
          !!selectedUserChat.messages && selectedUserChat.messages.length > 0
            ? [...selectedUserChat.messages, newMessage]
            : [newMessage],
      });
      setUsers(
        users.map((u) =>
          u.sync_id === newMessage.to_user_syncid ||
          u.sync_id === newMessage.from_user_syncid
            ? {
                ...u,
                messages:
                  !!u.messages && u.messages.length > 0
                    ? [...u.messages, newMessage]
                    : [newMessage],
              }
            : u
        )
      );
    },

    [selectedUserChat, users]
  );

  useEffect(() => {
    // socket.on("chat.message", receivedNewMessage);
    // return () => {
    //   socket.off("chat.message", receivedNewMessage);
    // };
  }, [receivedNewMessage]);

  useEffect(() => {
    setLoading(true);
    console.log("aeeeeeeeee");
    if (idRoom) {
      api
        .get<IRoomItem>(
          `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`
        )
        .then((response) => {
          const users = response.data.members?.map((member) => member.user);
          console.log(users);
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    } else {
      api
        .get<IUserItem[]>("/users")
        .then((response) =>
          setUsers(response.data.filter((u) => u.sync_id !== user.sync_id))
        )
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    }
  }, [idGroup, idOrganization, idRoom, user.sync_id]);

  // useEffect(() => {
  // socket.emit("chat.connect", user.sync_id);
  // }, [user.sync_id]);

  /**
   * CALLBACK FUCTIONS
   */

  const handleFormSubmit: SubmitHandler<IMessageItem> = useCallback(
    async (data, { reset }) => {
      setLoadingSubmit(true);
      try {
        const schema = Yup.object().shape({
          message: Yup.string().required(),
        });

        await schema.validate(data, { abortEarly: false });
        const { message } = data;

        if (message.trim() && selectedUserChat) {
          const newMessage = {
            id: uuid(),
            message,
            from_user_syncid: user.sync_id,
            to_user_syncid: selectedUserChat.to.sync_id,
          };
          // socket.emit("chat.message", newMessage);
          reset();
        }

        // alert(message);
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }
      } finally {
        setLoadingSubmit(false);
        if (formRef.current) {
          const nameInput = formRef.current.getFieldRef("message");
          nameInput.focus();
        }
      }
    },
    [selectedUserChat, user.sync_id]
  );

  const handleSelectedUserChat = useCallback((user: IUserItem) => {
    console.log(user);
    setSelectedUserChat({ to: user, messages: user.messages });
  }, []);

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle="Online Chat"
            goTo={
              location.state && location.state.oldPage
                ? location.state.oldPage
                : `/dashboard`
            }
          />
          <h1>Online Chat</h1>
        </div>
      </header>
      <Content>
        <ChatContent>
          <Users>
            {users.map((user, index) => (
              <li
                key={index}
                className={
                  !!selectedUserChat.to &&
                  user.sync_id === selectedUserChat.to.sync_id
                    ? "active"
                    : ""
                }
                onClick={() => handleSelectedUserChat(user)}
              >
                <Avatar
                  name={user.name}
                  src={user.avatar_url}
                  round
                  size="34"
                  maxInitials={2}
                />
                <h4>
                  {user.name} <span className="number">2</span>
                </h4>
              </li>
            ))}
            {/* className="new" */}
            {/* <li className=" active">
              <Avatar
                name="Leopoldo Jacobsen"
                round
                size="34"
                maxInitials={2}
              />
              <h4>Leopoldo Gostosao</h4>
            </li> */}
          </Users>
          <Messages>
            {!!selectedUserChat.to && (
              <>
                <header>
                  <Avatar
                    name={selectedUserChat.to.name}
                    src={selectedUserChat.to.avatar_url}
                    round
                    size="48"
                    maxInitials={2}
                  />
                  <h2>{selectedUserChat.to.name}</h2>
                </header>
                <ul>
                  {!!selectedUserChat.messages &&
                    selectedUserChat.messages.map((m, index) => (
                      <li
                        className={`list__item list__item--${
                          m.from_user_syncid === user.sync_id ? "mine" : "other"
                        }`}
                        key={index}
                      >
                        <div
                          className={`message message--${
                            m.from_user_syncid === user.sync_id
                              ? "mine"
                              : "other"
                          }`}
                        >
                          <p>{m.message}</p>
                          <strong>a few seconds ago</strong>
                        </div>
                      </li>
                    ))}
                </ul>

                <Form ref={formRef} onSubmit={handleFormSubmit}>
                  <Input
                    autoFocus
                    name="message"
                    placeholder="Type a new message here"
                    type="text"
                    isLoading={loadingSubmit}
                  />
                </Form>
              </>
            )}
          </Messages>
        </ChatContent>
      </Content>
    </Container>
  );
}
