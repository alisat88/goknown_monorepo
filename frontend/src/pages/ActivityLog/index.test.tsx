import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ActivityLog from "./index";
import api from "../../services/api";

jest.mock("../../hooks/auth", () => ({ useAuth: jest.fn() }));
jest.mock("../../services/api", () => ({ get: jest.fn() }));
const { useAuth } = require("../../hooks/auth");

const page = {
  events: [
    {
      user_id: "user-a",
      asset_id: "asset-a",
      event_type: "asset.access_started",
      recorded_at: "2026-01-01T00:00:00.000Z",
      estimated_active_ms: 0,
      outcome: "observed",
    },
  ],
  page: { limit: 50, offset: 0, total: 1 },
};
const renderPage = () =>
  render(
    <MemoryRouter>
      <ActivityLog />
    </MemoryRouter>
  );
beforeEach(() => jest.clearAllMocks());

test("administrator sees activity records from the controlled projection", async () => {
  useAuth.mockReturnValue({ user: { role: "admin" } });
  (api.get as jest.Mock).mockResolvedValue({ data: page });
  renderPage();
  expect(await screen.findByText("asset.access_started")).toBeInTheDocument();
  expect(screen.getByText("user-a")).toBeInTheDocument();
  expect(screen.getByText("0 seconds")).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith(
    "/admin/activity-log",
    expect.objectContaining({
      params: expect.objectContaining({ limit: 50, offset: 0 }),
    })
  );
  expect(api.get).not.toHaveBeenCalledWith("/admin/activity-log/access");
});

test("explicit non-admin viewer can open the page", async () => {
  useAuth.mockReturnValue({ user: { role: "user" } });
  (api.get as jest.Mock).mockImplementation((url: string) =>
    url === "/admin/activity-log/access"
      ? Promise.resolve({ data: { allowed: true } })
      : Promise.resolve({ data: page })
  );
  renderPage();
  expect(await screen.findByText("asset.access_started")).toBeInTheDocument();
  expect(api.get).toHaveBeenNthCalledWith(1, "/admin/activity-log/access");
  expect(api.get).toHaveBeenCalledWith(
    "/admin/activity-log",
    expect.any(Object)
  );
});

test("ordinary users remain denied without an activity query", async () => {
  useAuth.mockReturnValue({ user: { role: "user" } });
  (api.get as jest.Mock).mockRejectedValue({ response: { status: 403 } });
  renderPage();
  expect(await screen.findByText("Access denied.")).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/admin/activity-log/access");
  expect(api.get).not.toHaveBeenCalledWith(
    "/admin/activity-log",
    expect.anything()
  );
});

test("revoked viewers lose access when the activity query is rejected", async () => {
  useAuth.mockReturnValue({ user: { role: "user" } });
  (api.get as jest.Mock).mockImplementation((url: string) =>
    url === "/admin/activity-log/access"
      ? Promise.resolve({ data: { allowed: true } })
      : Promise.reject({ response: { status: 403 } })
  );
  renderPage();
  expect(await screen.findByText("Access denied.")).toBeInTheDocument();
  expect(screen.queryByText("asset.access_started")).not.toBeInTheDocument();
});

test("permission loading does not expose activity records", () => {
  useAuth.mockReturnValue({ user: { role: "user" } });
  (api.get as jest.Mock).mockReturnValue(new Promise(() => undefined));
  renderPage();
  expect(screen.getByText("Checking Activity Log access…")).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/admin/activity-log/access");
  expect(api.get).not.toHaveBeenCalledWith(
    "/admin/activity-log",
    expect.anything()
  );
});

test("permission-check failures do not expose activity records", async () => {
  useAuth.mockReturnValue({ user: { role: "user" } });
  (api.get as jest.Mock).mockRejectedValue(new Error("network"));
  renderPage();
  expect(
    await screen.findByText("Unable to verify Activity Log access.")
  ).toBeInTheDocument();
  expect(api.get).not.toHaveBeenCalledWith(
    "/admin/activity-log",
    expect.anything()
  );
});

test("applies filters only when submitted", async () => {
  useAuth.mockReturnValue({ user: { role: "admin" } });
  (api.get as jest.Mock).mockResolvedValue({
    data: { events: [], page: { limit: 50, offset: 0, total: 0 } },
  });
  renderPage();
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  (api.get as jest.Mock).mockClear();
  fireEvent.change(screen.getByPlaceholderText("User ID"), {
    target: { value: "synthetic-user" },
  });
  expect(api.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  expect(api.get).toHaveBeenCalledWith(
    "/admin/activity-log",
    expect.objectContaining({
      params: expect.objectContaining({ user: "synthetic-user" }),
    })
  );
});
