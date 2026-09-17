import React from "react";
import { MemoryRouter } from "react-router-dom";

import { ChakraProvider } from "@chakra-ui/react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";

import { useAuth } from "../../../hooks/auth";
import { useSocket } from "../../../hooks/socket";
import api from "../../../services/api";

import Messenger from "..";

import CreateGroupDialog from "../CreateGroupDialog";
import { messageBelongsToConversation } from "../types";

jest.mock("../../../services/api");
jest.mock("../../../hooks/auth");
jest.mock("../../../hooks/socket");
const listeners: Record<string, (...args: any[]) => void> = {};
const socket = {
  on: jest.fn((event, callback) => {
    listeners[event] = callback;
  }),
  off: jest.fn(),
  emit: jest.fn(),
};
const owner = {
  sync_id: "owner",
  email: "owner@example.com",
  conversations: {},
  name: "Owner",
};
const direct = {
  id: "alice",
  sync_id: "alice",
  name: "Alice",
  conversation: {
    id: "direct",
    sync_id: "direct",
    members: ["owner", "alice"],
  },
};
const group = {
  id: "group",
  sync_id: "group",
  name: "Team",
  conversation: {
    id: "group",
    sync_id: "group",
    type: "group",
    name: "Team",
    members: ["owner", "alice", "bob"],
    participants: [{ sync_id: "alice", name: "Alice" }],
  },
};
const message = {
  id: "message",
  sender: "alice",
  text: "Team message",
  conversation_id: "group",
  created_at: "2026-09-14T12:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  socket.on.mockImplementation((event, callback) => {
    listeners[event] = callback;
  });
  Object.keys(listeners).forEach((key) => delete listeners[key]);
  (useAuth as jest.Mock).mockReturnValue({ user: owner });
  (useSocket as jest.Mock).mockReturnValue({ socket });
  (api.get as jest.Mock).mockImplementation(async (path: string) => ({
    data:
      path === "/conversations"
        ? [direct, group]
        : path.includes("group")
        ? [message]
        : [],
  }));
  (api.post as jest.Mock).mockResolvedValue({ data: group.conversation });
});
const wrap = (child: React.ReactNode) =>
  render(
    <ChakraProvider>
      <MemoryRouter>{child}</MemoryRouter>
    </ChakraProvider>
  );

test("group dialog validates malformed, self and canonical duplicates, submits normalized participants", async () => {
  const created = jest.fn();
  wrap(
    <CreateGroupDialog
      onClose={jest.fn()}
      onCreated={created}
      creatorEmail={owner.email}
    />
  );
  const add = (value: string) => {
    fireEvent.change(screen.getByLabelText("Member email"), {
      target: { value },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
  };
  add("not-email");
  expect(screen.getByRole("alert").textContent).toContain("valid email");
  add("owner+alias@example.com");
  expect(screen.getByRole("alert").textContent).toContain("automatically");
  add(" Alice+work@Example.com ");
  add("alice@example.com");
  expect(screen.getByRole("alert").textContent).toContain("already added");
  add("bob@example.com");
  fireEvent.change(screen.getByLabelText("Group name"), {
    target: { value: " Team " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create Group" }));
  await waitFor(() => expect(created).toHaveBeenCalledWith(group.conversation));
  expect(api.post).toHaveBeenCalledWith("/conversations/group", {
    name: "Team",
    emails: ["alice@example.com", "bob@example.com"],
  });
});

test("server validation errors stay visible without closing dialog", async () => {
  (api.post as jest.Mock).mockRejectedValue({
    response: {
      data: { message: "No active account available for: bob@example.com" },
    },
  });
  const created = jest.fn();
  wrap(
    <CreateGroupDialog
      onClose={jest.fn()}
      onCreated={created}
      creatorEmail={owner.email}
    />
  );
  fireEvent.change(screen.getByLabelText("Group name"), {
    target: { value: "Team" },
  });
  ["alice@example.com", "bob@example.com"].forEach((value) => {
    fireEvent.change(screen.getByLabelText("Member email"), {
      target: { value },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
  });
  fireEvent.click(screen.getByRole("button", { name: "Create Group" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("bob@example.com")
  );
  expect(created).not.toHaveBeenCalled();
});

test("legacy direct history and group history stay separate when the sender overlaps", async () => {
  wrap(<Messenger />);
  fireEvent.click(await screen.findByRole("button", { name: "Alice" }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith("/conversations/direct/messages")
  );
  const before = (api.get as jest.Mock).mock.calls.length;
  await act(async () => {
    listeners.getMessage(message);
  });
  expect((api.get as jest.Mock).mock.calls).toHaveLength(before);
  expect(screen.queryByText("Team message")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Team/ }));
  expect(await screen.findByText("Team message")).toBeTruthy();
  expect(document.querySelector(".sender-name")?.textContent).toBe("Alice");
  expect(socket.emit.mock.calls.some((call) => call[0] === "sendMessage")).toBe(
    false
  );
});

test("a reloaded Messenger loads the saved group and its history", async () => {
  const first = wrap(<Messenger />);
  fireEvent.click(await screen.findByRole("button", { name: /Team/ }));
  await screen.findByText("Team message");
  first.unmount();
  wrap(<Messenger />);
  fireEvent.click(await screen.findByRole("button", { name: /Team/ }));
  expect(await screen.findByText("Team message")).toBeTruthy();
});

test("realtime routing requires conversation identity", () => {
  expect(messageBelongsToConversation(message, "group")).toBe(true);
  expect(messageBelongsToConversation(message, "direct")).toBe(false);
  expect(
    messageBelongsToConversation(
      { ...message, conversation_id: undefined },
      "group"
    )
  ).toBe(false);
});

test("sending a direct message posts once and relies on persisted history without a socket relay", async () => {
  let history: any[] = [];
  (api.get as jest.Mock).mockImplementation(async (path: string) => ({
    data: path === "/conversations" ? [direct, group] : history,
  }));
  (api.post as jest.Mock).mockImplementation(async () => {
    history = [
      {
        ...message,
        id: "sent",
        sender: "owner",
        conversation_id: "direct",
        text: "I'm testing Bob's aircraft",
      },
    ];
    return { data: history[0] };
  });
  wrap(<Messenger />);
  fireEvent.click(await screen.findByRole("button", { name: "Alice" }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Send message",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
  );
  fireEvent.change(screen.getByPlaceholderText("Type a new message here"), {
    target: { value: "I'm testing Bob's aircraft" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
  expect(api.post).toHaveBeenCalledWith("/conversations/direct/messages", {
    text: "I'm testing Bob's aircraft",
  });
  expect(await screen.findByText("I'm testing Bob's aircraft")).toBeTruthy();
  expect(socket.emit.mock.calls.some((call) => call[0] === "sendMessage")).toBe(
    false
  );
});

test("creating a group updates the conversation list and opens its history", async () => {
  wrap(<Messenger />);
  fireEvent.click(await screen.findByRole("button", { name: "Create Group" }));
  fireEvent.change(screen.getByLabelText("Group name"), {
    target: { value: "Team" },
  });
  ["alice@example.com", "bob@example.com"].forEach((value) => {
    fireEvent.change(screen.getByLabelText("Member email"), {
      target: { value },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
  });
  // Chakra makes the underlying page inert while the dialog is open.
  fireEvent.click(screen.getByRole("button", { name: "Create Group" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(await screen.findByText("Team message")).toBeTruthy();
  expect(api.get).toHaveBeenCalledWith("/conversations/group/messages");
});
