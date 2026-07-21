// Regression tests for FolderPreview fixes.
//
// fp-1: renders without blank screen (header visible)
// fp-2: filteredMy and my populated after load (assets rendered, no "no assets" message)
// fp-3: changing sort order after load does not crash (immutable sort + functional setAssets)
// fp-4: applying a mimetype filter after load does not crash (functional setAssets preserves state)
// fp-5: personal Edit Folder (Footer button) → /digitalassets/folders/:id/edit
// fp-6: room Edit Folder (Footer button) → room-prefixed /folders/:id/edit

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Switch } from "react-router-dom";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("../../../services/api");
jest.mock("../../../hooks/auth");
jest.mock("../../../hooks/toast");

// Prevent react-avatar from touching canvas/SVG in jsdom
jest.mock("react-avatar", () => ({
  __esModule: true,
  default: ({ name }: { name?: string }) => (
    <div data-testid="avatar">{name}</div>
  ),
}));

// Prevent Asset from rendering media elements
jest.mock("../../../components/Asset", () => ({
  __esModule: true,
  default: ({ name }: { name?: string }) => (
    <div data-testid="asset-item">{name}</div>
  ),
  AssetTypes: {},
  EnumAssetsType: {},
}));

// Mock Field to avoid the ContentLoader dependency in the preview header
jest.mock("../../../components/Field", () => ({
  __esModule: true,
  default: ({ value }: { value?: string }) => <span>{value ?? ""}</span>,
}));

// Suppress framer-motion animations to avoid act() warnings
jest.mock("framer-motion", () => {
  const React = require("react");
  const handler = {
    get(_: any, tag: string) {
      return ({ children, ...rest }: any) =>
        React.createElement(tag, rest, children);
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

// ── Import component after mocks ──────────────────────────────────────────────

import FolderPreview from "../Folder/preview";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FOLDER_SYNC_ID = "folder-sync-test-abc";
const PERSONAL_URL = `/digitalassets/folders/${FOLDER_SYNC_ID}`;
const ROOM_BASE = "/organizations/org-1/groups/grp-1/rooms/room-1";
const ROOM_URL = `${ROOM_BASE}/folders/${FOLDER_SYNC_ID}`;

function makeApiFolder(overrides: Record<string, unknown> = {}) {
  return {
    id: "folder-db-id",
    name: "Test Folder",
    owner: {
      id: "user-1",
      sync_id: "sync-1",
      name: "Test User",
      email: "test@example.com",
      avatar_url: "",
    },
    shared: false,
    editable: true,
    shared_users: [
      {
        id: "user-1",
        sync_id: "sync-1",
        name: "Test User",
        email: "test@example.com",
        avatar_url: "",
      },
    ],
    shared_groups: [],
    assets: [],
    ...overrides,
  };
}

function makeApiAsset(overrides: Record<string, unknown> = {}) {
  return {
    id: `asset-${Math.random()}`,
    sync_id: `asset-sync-${Math.random()}`,
    asset_url: "https://example.com/file.pdf",
    mimetype: "application/pdf",
    name: "Doc",
    privacy: "private" as const,
    created_at: "2025-01-01T10:00:00.000Z",
    ...overrides,
  };
}

let capturedLocation = { pathname: PERSONAL_URL };

function renderFolderPreview(url = PERSONAL_URL) {
  capturedLocation = { pathname: url };
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Route
        render={({ history }) => {
          capturedLocation = history.location;
          return null;
        }}
      />
      <Switch>
        <Route
          path="/digitalassets/folders/:id"
          exact
          component={FolderPreview}
        />
        <Route
          path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/folders/:id"
          exact
          component={FolderPreview}
        />
      </Switch>
    </MemoryRouter>
  );
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (useToast as jest.Mock).mockReturnValue({ addToast: mockAddToast });
  (useAuth as jest.Mock).mockReturnValue({ user: MOCK_USER });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

// ── fp-1 ──────────────────────────────────────────────────────────────────────

test("fp-1: FolderPreview renders without a blank screen (header with FOLDER: is visible)", async () => {
  mockGet.mockResolvedValueOnce({ data: makeApiFolder() });

  renderFolderPreview();

  // The <h1>FOLDER:<Field .../></h1> is always present — a blank screen would
  // have nothing in the document.
  await waitFor(() => {
    expect(
      screen.getByText((_, el) => {
        return !!el && el.tagName === "H1" && (el.textContent ?? "").includes("FOLDER");
      })
    ).toBeTruthy();
  });
});

// ── fp-2 ──────────────────────────────────────────────────────────────────────

test("fp-2: assets.filteredMy is populated after load (asset items rendered, no 'no assets' message)", async () => {
  mockGet.mockResolvedValueOnce({
    data: makeApiFolder({
      assets: [makeApiAsset({ name: "Doc A" }), makeApiAsset({ name: "Doc B" })],
    }),
  });

  renderFolderPreview();

  await waitFor(() => {
    // The mocked Asset component renders a div[data-testid="asset-item"] per asset
    expect(screen.getAllByTestId("asset-item").length).toBeGreaterThanOrEqual(1);
  });

  expect(screen.queryByText(/you don't have assets/i)).toBeNull();
});

// ── fp-3 ──────────────────────────────────────────────────────────────────────

test("fp-3: changing sort order after load does not crash (functional setAssets + immutable sort)", async () => {
  mockGet.mockResolvedValueOnce({
    data: makeApiFolder({
      assets: [
        makeApiAsset({ name: "Zebra", created_at: "2025-01-02T00:00:00.000Z" }),
        makeApiAsset({ name: "Apple", created_at: "2025-01-01T00:00:00.000Z" }),
      ],
    }),
  });

  renderFolderPreview();

  await waitFor(() => {
    expect(screen.getAllByTestId("asset-item").length).toBe(2);
  });

  // "A-Z" appears in both the Schedule column and the RightSection; use the first
  const sortAZ = screen.getAllByText(/^A-Z$/i)[0];
  expect(() => fireEvent.click(sortAZ)).not.toThrow();

  // Component still renders after the sort — no crash means state is intact
  expect(screen.getAllByTestId("asset-item").length).toBe(2);
});

// ── fp-4 ──────────────────────────────────────────────────────────────────────

test("fp-4: applying a mimetype filter after load does not crash (functional setAssets preserves full state shape)", async () => {
  mockGet.mockResolvedValueOnce({
    data: makeApiFolder({
      assets: [
        makeApiAsset({ name: "Image A", mimetype: "image/png" }),
        makeApiAsset({ name: "Doc B", mimetype: "application/pdf" }),
      ],
    }),
  });

  renderFolderPreview();

  await waitFor(() => {
    expect(screen.getAllByTestId("asset-item").length).toBe(2);
  });

  // "image" filter Item appears in both Schedule and RightSection columns
  const imageFilter = screen.getAllByText(/^image$/i)[0];
  expect(() => fireEvent.click(imageFilter)).not.toThrow();

  // The heading is still present — no crash, no blank screen
  expect(
    screen.getByText((_, el) => {
      return !!el && el.tagName === "H1" && (el.textContent ?? "").includes("FOLDER");
    })
  ).toBeTruthy();
});

// ── fp-5 ──────────────────────────────────────────────────────────────────────

test("fp-5: personal Edit Folder (Footer button) navigates to /digitalassets/folders/:id/edit", async () => {
  mockGet.mockResolvedValueOnce({ data: makeApiFolder() });
  capturedLocation = { pathname: PERSONAL_URL };

  renderFolderPreview(PERSONAL_URL);

  await waitFor(() => expect(mockGet).toHaveBeenCalled());

  // Footer is display:none by default; hidden:true reaches it.
  // BigButton (styled.div) has no button role, so this uniquely finds the Footer button.
  const editBtn = screen.getByRole("button", { name: /edit folder/i, hidden: true });
  fireEvent.click(editBtn);

  await waitFor(() => {
    expect(capturedLocation.pathname).toBe(
      `/digitalassets/folders/${FOLDER_SYNC_ID}/edit`
    );
  });
});

// ── fp-6 ──────────────────────────────────────────────────────────────────────

test("fp-6: room Edit Folder (Footer button) navigates to room-prefixed /folders/:id/edit", async () => {
  mockGet.mockResolvedValueOnce({ data: makeApiFolder() });
  capturedLocation = { pathname: ROOM_URL };

  renderFolderPreview(ROOM_URL);

  await waitFor(() => expect(mockGet).toHaveBeenCalled());

  const editBtn = screen.getByRole("button", { name: /edit folder/i, hidden: true });
  fireEvent.click(editBtn);

  await waitFor(() => {
    expect(capturedLocation.pathname).toBe(
      `${ROOM_BASE}/folders/${FOLDER_SYNC_ID}/edit`
    );
  });
});
