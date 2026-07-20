// Tests for the full "Create new folder" workflow at /digitalassets/folders/new.
//
// Covers:
//   da-new-1: /digitalassets/folders/new renders the creation form (no blank screen)
//   da-new-2: folderId is treated as undefined in creation mode (api.get not called)
//   da-new-3: empty folder name is rejected without calling api.post
//   da-new-4: valid name calls POST /me/folders with the correct payload
//   da-new-5: successful creation navigates to /digitalassets
//   da-new-6: back/cancel navigates to /digitalassets
//   da-new-7: API failure shows an error toast and the form stays visible

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
// Prevent jsdom from being overwhelmed by react-select's focus management
jest.mock("../../../components/AsyncSelect", () => ({
  __esModule: true,
  default: ({ placeholder }: { placeholder?: string }) => (
    <input data-testid="async-select" placeholder={placeholder ?? "Search"} />
  ),
}));

import api from "../../../services/api";
import { useAuth } from "../../../hooks/auth";
import { useToast } from "../../../hooks/toast";

const mockPost = jest.fn();
const mockGet = jest.fn();
(api as any).post = mockPost;
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

import Folder from "../Folder";

// ── Route helper ──────────────────────────────────────────────────────────────

let capturedLocation = { pathname: "/digitalassets/folders/new" };

function renderNewFolder() {
  capturedLocation = { pathname: "/digitalassets/folders/new" };
  return render(
    <MemoryRouter initialEntries={["/digitalassets/folders/new"]}>
      <Route
        render={({ history }) => {
          capturedLocation = history.location;
          return null;
        }}
      />
      <Switch>
        {/* Route has no :id param — folderId will be undefined (creation mode) */}
        <Route path="/digitalassets/folders/new" component={Folder} />
        <Route
          path="/digitalassets"
          render={() => (
            <div data-testid="da-page">Digital Assets</div>
          )}
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
  // Silence the debug console.log(formData) inside handleSubmitFolder
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

// ── da-new-1 ─────────────────────────────────────────────────────────────────

test("da-new-1: /digitalassets/folders/new renders the creation form without a blank screen", () => {
  renderNewFolder();

  // Heading and submit button prove the form is visible, not a blank page
  // "New Folder" appears in both the <h1> and the ButtonBack mobile span,
  // so query the heading role specifically.
  expect(screen.getByRole("heading", { name: /new folder/i })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: /create folder/i })
  ).toBeTruthy();
  // Edit button is absent — we are in creation mode, not edit mode
  expect(
    screen.queryByRole("button", { name: /edit folder/i })
  ).toBeNull();
});

// ── da-new-2 ─────────────────────────────────────────────────────────────────

test("da-new-2: creation mode does not call api.get — folderId is undefined, not the string 'new'", async () => {
  renderNewFolder();

  // Allow all mount-time effects to settle
  await new Promise((r) => setTimeout(r, 50));

  expect(mockGet).not.toHaveBeenCalled();
});

// ── da-new-3 ─────────────────────────────────────────────────────────────────

test("da-new-3: submitting with an empty folder name does not call api.post (Yup validation blocks it)", async () => {
  renderNewFolder();

  // Submit without entering a name
  fireEvent.click(screen.getByRole("button", { name: /create folder/i }));

  // Give async validation time to run and verify the API was not called
  await new Promise((r) => setTimeout(r, 100));
  expect(mockPost).not.toHaveBeenCalled();
});

// ── da-new-4 ─────────────────────────────────────────────────────────────────

test("da-new-4: entering a valid name and submitting calls POST /me/folders with the correct payload", async () => {
  mockPost.mockResolvedValueOnce({ data: {} });

  renderNewFolder();

  const input = screen.getByPlaceholderText(/folder name/i);
  fireEvent.change(input, { target: { value: "My Project Files" } });

  fireEvent.click(screen.getByRole("button", { name: /create folder/i }));

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledWith(
      "/me/folders",
      expect.objectContaining({ name: "My Project Files" })
    );
  });
});

// ── da-new-5 ─────────────────────────────────────────────────────────────────

test("da-new-5: successful creation navigates back to /digitalassets (the personal folder list)", async () => {
  mockPost.mockResolvedValueOnce({ data: {} });

  renderNewFolder();

  const input = screen.getByPlaceholderText(/folder name/i);
  fireEvent.change(input, { target: { value: "My Project Files" } });

  fireEvent.click(screen.getByRole("button", { name: /create folder/i }));

  await waitFor(() => {
    expect(capturedLocation.pathname).toBe("/digitalassets");
  });
});

// ── da-new-6 ─────────────────────────────────────────────────────────────────

test("da-new-6: clicking the back/cancel link navigates to /digitalassets without submitting", async () => {
  renderNewFolder();

  // ButtonBack renders as a <Link> (anchor) with an onClick that calls history.push(goTo)
  // In creation mode, goTo = `${baseNavigationPath}/digitalassets` = `/digitalassets`
  const backLink = screen.getByRole("link");
  fireEvent.click(backLink);

  await waitFor(() => {
    expect(capturedLocation.pathname).toBe("/digitalassets");
  });

  // No API call was made
  expect(mockPost).not.toHaveBeenCalled();
});

// ── da-new-7 ─────────────────────────────────────────────────────────────────

test("da-new-7: API failure shows an error toast and the form stays visible (page does not go blank)", async () => {
  const serverErr = Object.assign(new Error("500"), {
    response: { data: { error: "Internal server error" } },
  });
  mockPost.mockRejectedValueOnce(serverErr);

  renderNewFolder();

  const input = screen.getByPlaceholderText(/folder name/i);
  fireEvent.change(input, { target: { value: "My Project Files" } });

  fireEvent.click(screen.getByRole("button", { name: /create folder/i }));

  await waitFor(() => {
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
  });

  // The form is still rendered — no blank screen
  expect(
    screen.getByRole("button", { name: /create folder/i })
  ).toBeTruthy();

  // No navigation to /digitalassets on failure
  expect(capturedLocation.pathname).toBe("/digitalassets/folders/new");
});
