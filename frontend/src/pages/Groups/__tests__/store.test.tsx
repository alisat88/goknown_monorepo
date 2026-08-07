import React from "react";
import { MemoryRouter, Route } from "react-router-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useAuth } from "../../../hooks/auth";
import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import GroupStore from "../store";

jest.mock("../../../services/api");
jest.mock("../../../hooks/auth");
jest.mock("../../../hooks/toast");
jest.mock("../../../hooks/dialog", () => ({
  useDialog: () => ({ showDialog: jest.fn() }),
}));

jest.mock("../../../components/ButtonTransform", () => ({
  __esModule: true,
  default: ({ children, onChangePanel }: any) => (
    <div>
      <button type="button" onClick={() => onChangePanel(true)}>
        Open participant selector
      </button>
      {children}
    </div>
  ),
}));

const PARTICIPANT = {
  id: "participant-id",
  sync_id: "participant-sync-id",
  label: "Selected Participant",
  email: "participant@example.com",
  firstName: "Selected",
  avatar_url: "",
};

jest.mock("../../../components/AsyncSelect", () => ({
  __esModule: true,
  default: ({ onChange, placeholder, name }: any) => (
    <button
      type="button"
      data-testid={name}
      onClick={() => onChange(PARTICIPANT)}
    >
      {placeholder}
    </button>
  ),
}));

const mockPost = jest.fn();
(api as any).post = mockPost;

const MOCK_USER = {
  id: "owner-id",
  sync_id: "owner-sync-id",
  name: "Owner User",
  email: "owner@example.com",
  avatar_url: "",
};

function renderNewGroup() {
  return render(
    <MemoryRouter initialEntries={["/groups/new"]}>
      <Route path="/groups/new" component={GroupStore} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: MOCK_USER });
  (useToast as jest.Mock).mockReturnValue({ addToast: jest.fn() });
});

test("selects a participant using the correctly named field", () => {
  renderNewGroup();

  expect(screen.getByText("Select a Participant")).toBeTruthy();
  expect(screen.queryByText(/partcipant/i)).toBeNull();

  fireEvent.click(screen.getByTestId("participant"));

  expect(screen.getByText("Participant")).toBeTruthy();
});

test("enables Create Group and submits the selected participant sync id", async () => {
  mockPost.mockResolvedValueOnce({ data: {} });
  renderNewGroup();

  const createButton = screen.getByRole("button", { name: "CREATE GROUP" });
  fireEvent.change(screen.getByPlaceholderText("Sub group name"), {
    target: { value: "Engineering" },
  });
  fireEvent.click(screen.getByRole("button", { name: /open participant/i }));
  fireEvent.click(screen.getByTestId("participant"));

  expect(createButton).not.toBeDisabled();
  fireEvent.click(createButton);

  await waitFor(() =>
    expect(mockPost).toHaveBeenCalledWith("/me/groups", {
      name: "Engineering",
      description: "",
      shared_users_ids: [PARTICIPANT.sync_id],
    })
  );
});

test("keeps Create Group disabled while required values are missing", () => {
  renderNewGroup();

  const createButton = screen.getByRole("button", { name: "CREATE GROUP" });
  expect(createButton).toBeDisabled();

  fireEvent.change(screen.getByPlaceholderText("Sub group name"), {
    target: { value: "Engineering" },
  });
  expect(createButton).toBeDisabled();

  fireEvent.change(screen.getByPlaceholderText("Sub group name"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByTestId("participant"));
  expect(createButton).toBeDisabled();
});
