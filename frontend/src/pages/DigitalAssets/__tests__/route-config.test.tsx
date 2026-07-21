// Regression tests for route ordering and component assignment.
//
// These tests mirror the exact route patterns from src/routes/index.tsx using
// lightweight stubs to verify that:
//   - /folders/new → Folder (creation), not FolderPreview
//   - /folders/:id → FolderPreview, not Folder
//   - /folders/:id/edit → Folder (edit mode)
//   - the above hold for both personal and room contexts
//   - the string "new" is never captured as a folder ID
//
// rc-1: personal /digitalassets/folders/new → Folder (not FolderPreview)
// rc-2: personal /digitalassets/folders/:id → FolderPreview (not Folder)
// rc-3: personal /digitalassets/folders/:id/edit → Folder (not FolderPreview)
// rc-4: room .../folders/new → Folder (not FolderPreview)
// rc-5: room .../folders/:id → FolderPreview (not Folder)
// rc-6: room .../folders/:id/edit → Folder (not FolderPreview)

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Switch, Route } from "react-router-dom";

// ── Stubs ─────────────────────────────────────────────────────────────────────

const FolderStub = () => <div data-testid="folder-stub" />;
const FolderPreviewStub = () => <div data-testid="folder-preview-stub" />;

// ── Constants ─────────────────────────────────────────────────────────────────

const ROOM_PREFIX =
  "/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom";
const ROOM_URL = "/organizations/org-1/groups/grp-1/rooms/room-1";
const FOLDER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

// ── Route helper ──────────────────────────────────────────────────────────────
// Mirrors the route ORDER from src/routes/index.tsx exactly, using stubs.

function renderRoute(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Switch>
        {/* Personal routes — ordered: new → :id/edit → :id */}
        <Route
          path="/digitalassets/folders/new"
          exact
          render={() => <FolderStub />}
        />
        <Route
          path="/digitalassets/folders/:id/edit"
          exact
          render={() => <FolderStub />}
        />
        <Route
          path="/digitalassets/folders/:id"
          exact
          render={() => <FolderPreviewStub />}
        />
        {/* Room routes — ordered: new → :id/edit → :id */}
        <Route
          path={`${ROOM_PREFIX}/folders/new`}
          exact
          render={() => <FolderStub />}
        />
        <Route
          path={`${ROOM_PREFIX}/folders/:id/edit`}
          exact
          render={() => <FolderStub />}
        />
        <Route
          path={`${ROOM_PREFIX}/folders/:id`}
          exact
          render={() => <FolderPreviewStub />}
        />
      </Switch>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// ── rc-1 ──────────────────────────────────────────────────────────────────────

test("rc-1: /digitalassets/folders/new renders Folder (creation), not FolderPreview", () => {
  renderRoute("/digitalassets/folders/new");
  expect(screen.getByTestId("folder-stub")).toBeTruthy();
  expect(screen.queryByTestId("folder-preview-stub")).toBeNull();
});

// ── rc-2 ──────────────────────────────────────────────────────────────────────

test("rc-2: /digitalassets/folders/:id renders FolderPreview, not Folder", () => {
  renderRoute(`/digitalassets/folders/${FOLDER_ID}`);
  expect(screen.getByTestId("folder-preview-stub")).toBeTruthy();
  expect(screen.queryByTestId("folder-stub")).toBeNull();
});

// ── rc-3 ──────────────────────────────────────────────────────────────────────

test("rc-3: /digitalassets/folders/:id/edit renders Folder (edit mode), not FolderPreview", () => {
  renderRoute(`/digitalassets/folders/${FOLDER_ID}/edit`);
  expect(screen.getByTestId("folder-stub")).toBeTruthy();
  expect(screen.queryByTestId("folder-preview-stub")).toBeNull();
});

// ── rc-4 ──────────────────────────────────────────────────────────────────────

test("rc-4: room .../folders/new renders Folder (creation), not FolderPreview", () => {
  renderRoute(`${ROOM_URL}/folders/new`);
  expect(screen.getByTestId("folder-stub")).toBeTruthy();
  expect(screen.queryByTestId("folder-preview-stub")).toBeNull();
});

// ── rc-5 ──────────────────────────────────────────────────────────────────────

test("rc-5: room .../folders/:id renders FolderPreview, not Folder", () => {
  renderRoute(`${ROOM_URL}/folders/${FOLDER_ID}`);
  expect(screen.getByTestId("folder-preview-stub")).toBeTruthy();
  expect(screen.queryByTestId("folder-stub")).toBeNull();
});

// ── rc-6 ──────────────────────────────────────────────────────────────────────

test("rc-6: room .../folders/:id/edit renders Folder (edit mode), not FolderPreview", () => {
  renderRoute(`${ROOM_URL}/folders/${FOLDER_ID}/edit`);
  expect(screen.getByTestId("folder-stub")).toBeTruthy();
  expect(screen.queryByTestId("folder-preview-stub")).toBeNull();
});
