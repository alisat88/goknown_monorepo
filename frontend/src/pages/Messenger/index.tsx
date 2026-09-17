import { formatDistance, parseISO } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "react-avatar";
import { FiSend, FiUsers } from "react-icons/fi";
import { useParams } from "react-router-dom";

import { FormHandles, SubmitHandler } from "@unform/core";
import { Form } from "@unform/web";

import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import UserLoader from "../../components/ContentLoader/UserLoader";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import { useSocket } from "../../hooks/socket";
import api from "../../services/api";
import CreateGroupDialog, { messengerError } from "./CreateGroupDialog";
import { Container, Content, ChatContent, Users, Messages } from "./styles";
import {
  IChatItem,
  IConversationItem,
  IMessageItem,
  messageBelongsToConversation,
} from "./types";

export default function Messenger() {
  const [chats, setChats] = useState<IChatItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ usersync_id: string }[]>([]);
  const [currentChat, setCurrentChat] = useState<IChatItem>();
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<FormHandles>(null);
  const scrollRef = useRef<HTMLLIElement>(null);
  const activeId = useRef<string>();
  const selection = useRef(0);
  const historyRevision = useRef(0);
  const listRevision = useRef(0);
  const { user } = useAuth();
  const { socket } = useSocket();
  const { idRoom } = useParams<{ idRoom?: string }>();

  const refreshChats = useCallback(async () => {
    listRevision.current += 1;
    const revision = listRevision.current;
    const { data } = await api.get<IChatItem[]>("/conversations", {
      params: { room_id: idRoom },
    });
    if (revision === listRevision.current) {
      setChats(data);
      setCurrentChat((previous) => {
        if (!previous?.conversation) return previous;
        const updated = data.find(
          (chat) =>
            chat.conversation?.sync_id === previous?.conversation?.sync_id
        );
        return previous && updated
          ? { ...updated, messages: previous.messages }
          : previous;
      });
    }
    return data;
  }, [idRoom]);

  // Fetching history acknowledges exactly this authenticated user's read state.
  const loadHistory = useCallback(async (id: string) => {
    historyRevision.current += 1;
    const revision = historyRevision.current;
    const { data } = await api.get<IMessageItem[]>(
      `/conversations/${id}/messages`
    );
    if (activeId.current === id && revision === historyRevision.current) {
      setCurrentChat((previous) =>
        previous ? { ...previous, messages: data } : previous
      );
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const refresh = () => {
      refreshChats()
        .catch((err) => setError(messengerError(err)))
        .finally(() => setLoading(false));
    };
    const reconnect = () => {
      refresh();
      if (activeId.current)
        loadHistory(activeId.current).catch((err) =>
          setError(messengerError(err))
        );
      socket.emit("addUser"); // Request presence only; identity is authenticated by the server.
    };
    const receive = (message: IMessageItem) => {
      if (
        activeId.current &&
        messageBelongsToConversation(message, activeId.current)
      ) {
        loadHistory(activeId.current).catch((err) =>
          setError(messengerError(err))
        );
      }
    };
    const presence = (users: { usersync_id: string }[]) =>
      setOnlineUsers(users);
    refresh();
    socket.emit("addUser");
    socket.on("getMessage", receive);
    socket.on("getUsers", presence);
    socket.on("conversationsChanged", refresh);
    socket.on("connect", reconnect);
    window.addEventListener("focus", reconnect);
    return () => {
      listRevision.current += 1;
      historyRevision.current += 1;
      socket.off("getMessage", receive);
      socket.off("getUsers", presence);
      socket.off("conversationsChanged", refresh);
      socket.off("connect", reconnect);
      window.removeEventListener("focus", reconnect);
    };
  }, [socket, refreshChats, loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [currentChat?.messages]);

  const selectChat = useCallback(
    async (chat: IChatItem) => {
      selection.current += 1;
      const revision = selection.current;
      historyRevision.current += 1;
      activeId.current = undefined;
      setCurrentChat(chat);
      setLoadingMessages(true);
      setError("");
      try {
        let { conversation } = chat;
        if (!conversation) {
          const { data } = await api.post<IConversationItem>("/conversations", {
            receiver_id: chat.sync_id,
          });
          conversation = data;
        }
        if (selection.current !== revision) return;
        activeId.current = conversation.sync_id;
        setCurrentChat({ ...chat, conversation });
        await loadHistory(conversation.sync_id);
        await refreshChats();
      } catch (err) {
        if (selection.current === revision) {
          setError(messengerError(err));
          setLoadingMessages(false);
        }
      }
    },
    [loadHistory, refreshChats]
  );

  const sendMessage: SubmitHandler<{ text: string }> = async (
    { text },
    { reset }
  ) => {
    const id = activeId.current;
    if (!id || loadingSubmit || !text?.trim()) return;
    setLoadingSubmit(true);
    setError("");
    try {
      await api.post<IMessageItem>(`/conversations/${id}/messages`, {
        text: text.trim(),
      });
      // There is no client socket relay. Reload the committed history, avoiding duplicates.
      if (activeId.current === id) {
        reset();
        await loadHistory(id);
      }
      await refreshChats();
    } catch (err) {
      setError(messengerError(err));
    } finally {
      setLoadingSubmit(false);
    }
  };

  const groupCreated = (conversation: IConversationItem) => {
    setCreatingGroup(false);
    const chat: IChatItem = {
      id: conversation.id,
      sync_id: conversation.sync_id,
      name: conversation.name || "Group",
      conversation,
    };
    setChats((previous) => [
      chat,
      ...previous.filter(
        (item) => item.conversation?.sync_id !== conversation.sync_id
      ),
    ]);
    selectChat(chat);
  };

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack mobileTitle="Messenger" goTo="dashboard" />
          <h1>Online Chat</h1>
        </div>
      </header>
      <Content>
        {error && <p role="alert">{error}</p>}
        <ChatContent>
          <Users>
            {!idRoom && (
              <li className="create-group">
                <Button type="button" onClick={() => setCreatingGroup(true)}>
                  <FiUsers /> Create Group
                </Button>
              </li>
            )}
            {loading && <UserLoader />}
            {!loading &&
              chats.map((chat) => {
                const group = chat.conversation?.type === "group";
                const unread =
                  user.conversations?.[chat.conversation?.sync_id || ""] ??
                  chat.news ??
                  0;
                return (
                  <li
                    key={chat.sync_id}
                    className={
                      chat.sync_id === currentChat?.sync_id ? "active" : ""
                    }
                    onClick={() => selectChat(chat)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectChat(chat);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <Avatar
                      name={chat.name}
                      src={chat.avatar_url}
                      round
                      size="34"
                      maxInitials={2}
                    />
                    {!group &&
                      onlineUsers.some(
                        (online) => online.usersync_id === chat.sync_id
                      ) && <b />}
                    <h4>
                      {group && <FiUsers aria-label="Group" />} {chat.name}
                      {unread > 0 && <span className="number">{unread}</span>}
                    </h4>
                  </li>
                );
              })}
          </Users>
          <Messages>
            {currentChat ? (
              <>
                <header>
                  <Avatar
                    name={currentChat.name}
                    src={currentChat.avatar_url}
                    round
                    size="48"
                    maxInitials={2}
                  />
                  <h2>
                    {currentChat.name}
                    {currentChat.conversation?.type === "group" && (
                      <small>
                        {" "}
                        · {currentChat.conversation.members.length} members
                      </small>
                    )}
                  </h2>
                </header>
                <ul aria-live="polite">
                  {loadingMessages && <li>Loading messages…</li>}
                  {!loadingMessages &&
                    currentChat.messages?.map((message, index) => {
                      const mine = message.sender === user.sync_id;
                      return (
                        <li
                          ref={scrollRef}
                          className={`list__item list__item--${
                            mine ? "mine" : "other"
                          }`}
                          key={message.id || message._id || index}
                        >
                          <div
                            className={`message message--${
                              mine ? "mine" : "other"
                            }`}
                          >
                            {!mine &&
                              currentChat.conversation?.type === "group" && (
                                <span className="sender-name">
                                  {currentChat.conversation.participants?.find(
                                    (member) =>
                                      member.sync_id === message.sender
                                  )?.name || "Member"}
                                </span>
                              )}
                            <p>{message.text}</p>
                            <strong>
                              {formatDistance(
                                parseISO(message.created_at),
                                new Date(),
                                { addSuffix: true }
                              )}
                            </strong>
                          </div>
                        </li>
                      );
                    })}
                </ul>
                <Form ref={formRef} onSubmit={sendMessage}>
                  <Input
                    autoFocus
                    name="text"
                    placeholder="Type a new message here"
                    type="text"
                    maxLength={10000}
                    disabled={loadingMessages || loadingSubmit}
                  />
                  <Button
                    type="submit"
                    aria-label="Send message"
                    isLoading={loadingSubmit}
                    disabled={loadingMessages || loadingSubmit}
                  >
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
      {creatingGroup && (
        <CreateGroupDialog
          creatorEmail={user.email}
          onClose={() => setCreatingGroup(false)}
          onCreated={groupCreated}
        />
      )}
    </Container>
  );
}
