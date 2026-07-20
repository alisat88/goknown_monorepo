// Tests for Digital Assets navigation and filter fixes.
//
// Covers:
//   1. room_id == null filter: folders with null AND undefined room_id both appear
//   2. Navigation: "New Folder" routes to /digitalassets/folders/new
//   3. Navigation: folder click routes to /digitalassets/folders/:id
//   4. Empty state: shown when no folders
//   5. Error state: shown when API fails

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Switch } from "react-router-dom";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("../../../services/api");
jest.mock("../../../hooks/auth");
jest.mock("../../../hooks/toast");
jest.mock("../../../hooks/dialog", () => ({
  useDialog: () => ({ showDialog: jest.fn() }),
}));
// Suppress framer-motion animation to avoid act() warnings in tests.
// The Proxy covers every motion.* tag used in the component's styles.ts.
jest.mock("framer-motion", () => {
  const React = require("react");
  const handler = {
    get(_: any, tag: string) {
      return ({ children, ...rest }: any) => React.createElement(tag, rest, children);
    },
  };
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: new Proxy({}, handler),
  };
});

import api from "../../../services/api";
import { useAuth } from "../../../hooks/auth";
import { useToast } from "../../../hooks/toast";

const mockGet = jest.fn();
(api as any).get = mockGet;

const mockAddToast = jest.fn();
(useToast as jest.Mock).mockReturnValue({ addToast: mockAddToast });

const MOCK_USER = {
  id: "user-1",
  sync_id: "sync-1",
  name: "Test User",
  email: "test@example.com",
  avatar_url: "",
  role: "user",
};
(useAuth as jest.Mock).mockReturnValue({ user: MOCK_USER });

// ── Import component after mocks are set ──────────────────────────────────────

import DigitalAssets from "../index";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFolder(overrides: Record<string, unknown> = {}) {
  return {
    id: `folder-${Math.random()}`,
    sync_id: `sync-${Math.random()}`,
    name: "My Folder",
    owner: { sync_id: "sync-1", name: "Test User" },
    editable: true,
    welcome: false,
    shared_users: [{ sync_id: "sync-1" }],
    shared_groups: [],
    room_id: null,
    ...overrides,
  };
}

function makeAsset(overrides: Record<string, unknown> = {}) {
  return {
    id: `asset-${Math.random()}`,
    sync_id: `asset-sync-${Math.random()}`,
    asset_url: "https://example.com/file.png",
    mimetype: "image/png",
    name: "Test Asset",
    description: "desc",
    privacy: "private",
    created_at: "2025-01-01T10:00:00.000Z",
    room_id: null,
    folder: null,
    ...overrides,
  };
}

const EMPTY_RESPONSE = { myassets: [], publicassets: [], folders: [] };

let capturedHistoryLocation = { pathname: "" };

function renderPage(path = "/digitalassets") {
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      {/* Capture current location from the router context */}
      <Route
        render={({ history }) => {
          capturedHistoryLocation = history.location;
          return null;
        }}
      />
      <Switch>
        <Route path="/digitalassets" exact component={DigitalAssets} />
      </Switch>
    </MemoryRouter>
  );
  return utils;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (useToast as jest.Mock).mockReturnValue({ addToast: mockAddToast });
  (useAuth as jest.Mock).mockReturnValue({ user: MOCK_USER });
});

// ── da-1: room_id null filter ─────────────────────────────────────────────────

test("da-1: folders with room_id: null are shown in personal view", async () => {
  mockGet.mockResolvedValueOnce({
    data: {
      ...EMPTY_RESPONSE,
      folders: [makeFolder({ name: "Null Folder", room_id: null })],
    },
  });

  renderPage();

  await waitFor(() => {
    expect(screen.getByText("Null Folder")).toBeTruthy();
  });
});

// ── da-2: room_id undefined filter ───────────────────────────────────────────

test("da-2: folders with room_id absent (undefined) are also shown in personal view", async () => {
  const folder = makeFolder({ name: "Undefined RoomId Folder" });
  delete (folder as any).room_id;

  mockGet.mockResolvedValueOnce({
    data: { ...EMPTY_RESPONSE, folders: [folder] },
  });

  renderPage();

  await waitFor(() => {
    expect(screen.getByText("Undefined RoomId Folder")).toBeTruthy();
  });
});

// ── da-3: room-scoped folders are excluded from personal view ─────────────────

test("da-3: folders with a non-null room_id are excluded from personal view", async () => {
  mockGet.mockResolvedValueOnce({
    data: {
      ...EMPTY_RESPONSE,
      folders: [makeFolder({ name: "Room Folder", room_id: "some-room-id" })],
    },
  });

  renderPage();

  await waitFor(() => {
    expect(mockGet).toHaveBeenCalled();
  });

  expect(screen.queryByText("Room Folder")).toBeNull();
});

// ── da-4: empty state shown when no folders ───────────────────────────────────

test("da-4: empty state message appears when there are no personal folders", async () => {
  mockGet.mockResolvedValueOnce({ data: EMPTY_RESPONSE });

  renderPage();

  await waitFor(() => {
    expect(
      screen.getByText(/no folders yet/i)
    ).toBeTruthy();
  });
});

// ── da-5: folders list shown when data is present ─────────────────────────────

test("da-5: existing folders are rendered and empty state is not shown", async () => {
  mockGet.mockResolvedValueOnce({
    data: {
      ...EMPTY_RESPONSE,
      folders: [makeFolder({ name: "Existing Folder" })],
    },
  });

  renderPage();

  await waitFor(() => {
    expect(screen.getByText("Existing Folder")).toBeTruthy();
  });

  expect(screen.queryByText(/no folders yet/i)).toBeNull();
});

// ── da-6: error state shown on API failure ────────────────────────────────────

test("da-6: error banner appears when the API call fails", async () => {
  mockGet.mockRejectedValueOnce(new Error("Network error"));

  renderPage();

  await waitFor(() => {
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/could not load/i);
  });
});

// ── da-7: New Folder button navigates to /digitalassets/folders/new ───────────

test("da-7: clicking New Folder navigates to /digitalassets/folders/new", async () => {
  mockGet.mockResolvedValueOnce({ data: EMPTY_RESPONSE });
  capturedHistoryLocation = { pathname: "/digitalassets" };

  renderPage();

  await waitFor(() => {
    expect(mockGet).toHaveBeenCalled();
  });

  fireEvent.click(screen.getByTestId("new-folder-btn"));

  await waitFor(() => {
    expect(capturedHistoryLocation.pathname).toBe("/digitalassets/folders/new");
  });
});

// ── da-8: clicking a folder navigates to /digitalassets/folders/:id ───────────

test("da-8: clicking a folder card navigates to /digitalassets/folders/:sync_id", async () => {
  const folder = makeFolder({ sync_id: "folder-sync-abc", name: "Click Me" });
  mockGet.mockResolvedValueOnce({
    data: { ...EMPTY_RESPONSE, folders: [folder] },
  });
  capturedHistoryLocation = { pathname: "/digitalassets" };

  renderPage();

  await waitFor(() => {
    expect(screen.getByText("Click Me")).toBeTruthy();
  });

  // h4 text bubbles up to the FolderList onClick handler
  fireEvent.click(screen.getByText(/click me/i));

  await waitFor(() => {
    expect(capturedHistoryLocation.pathname).toBe(
      "/digitalassets/folders/folder-sync-abc"
    );
  });
});
