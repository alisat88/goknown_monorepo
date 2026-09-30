import React from "react";
import { MemoryRouter, Route } from "react-router-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useToast } from "../../../../hooks/toast";
import api from "../../../../services/api";
import EditRoom from "../edit";

jest.mock("../../../../services/api");
jest.mock("../../../../hooks/toast");
jest.mock("../../../../components/Header", () => () => null);

const app = { sync_id: "app-sync", flag: "forms", name: "Forms" };
const path = "/organizations/org-sync/groups/group-sync/rooms";
const toast = jest.fn();

function mount() {
  return render(
    <MemoryRouter initialEntries={[`${path}/new`]}>
      <Route
        exact
        path="/organizations/:idOrganization/groups/:idGroup/rooms/new"
      >
        <EditRoom />
      </Route>
      <Route exact path="/organizations/:idOrganization/groups/:idGroup/rooms">
        <div>Subgroup listing</div>
      </Route>
    </MemoryRouter>
  );
}

async function submit() {
  await waitFor(() =>
    expect(screen.getByText("SAVE CHANGES")).not.toBeDisabled()
  );
  fireEvent.change(screen.getByPlaceholderText("Room name"), {
    target: { value: "Research" },
  });
  fireEvent.click(screen.getByText("SAVE CHANGES"));
}

beforeEach(() => {
  jest.clearAllMocks();
  (useToast as jest.Mock).mockReturnValue({ addToast: toast });
  (api.post as jest.Mock).mockResolvedValue({ data: { sync_id: "new-room" } });
});

it.each([{ catalog: [] }, { catalog: [{ ...app, flag: "wallet" }] }])(
  "creates and returns to listing when no app fields are registered (%j)",
  async ({ catalog }) => {
    (api.get as jest.Mock).mockResolvedValue({ data: catalog });
    mount();
    await screen.findByText("No apps available. Apps are optional.");
    await submit();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(path.slice(1), {
        name: "Research",
        dls_syncids: [],
      })
    );
    await screen.findByText("Subgroup listing");
  }
);

it.each([false, true])("preserves app selection: %s", async (selected) => {
  (api.get as jest.Mock).mockResolvedValue({ data: [app] });
  const { container } = mount();
  await screen.findByText("Forms");
  if (selected) {
    const toggle = container.querySelector(".switch");
    if (!toggle) throw new Error("App toggle was not rendered");
    fireEvent.click(toggle);
  }
  await submit();
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(path.slice(1), {
      name: "Research",
      dls_syncids: selected ? [app.sync_id] : [],
    })
  );
});

it.each([null, {}, [{ name: "Missing identifiers" }]])(
  "reports malformed app responses (%j)",
  async (data) => {
    (api.get as jest.Mock).mockResolvedValue({ data });
    mount();
    await screen.findByRole("alert");
    expect(screen.getByText("SAVE CHANGES")).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  }
);

it("reports app loading failures", async () => {
  (api.get as jest.Mock).mockRejectedValue(new Error("Network error"));
  mount();
  await screen.findByText("Unable to load apps. Please reload and try again.");
  expect(screen.getByText("SAVE CHANGES")).toBeDisabled();
});

it("rejects a blank name without sending a request", async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: [] });
  mount();
  await screen.findByText("No apps available. Apps are optional.");
  fireEvent.click(screen.getByText("SAVE CHANGES"));
  await screen.findByText("Subgroup name is required");
  expect(api.post).not.toHaveBeenCalled();
});

it("retains an existing app assignment when editing a subgroup", async () => {
  (api.get as jest.Mock).mockImplementation((url) =>
    Promise.resolve({
      data: url === "/dls" ? [app] : { name: "Research", dls: [app] },
    })
  );
  (api.put as jest.Mock).mockResolvedValue({ data: {} });
  render(
    <MemoryRouter initialEntries={[`${path}/room-sync/edit`]}>
      <Route path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/edit">
        <EditRoom />
      </Route>
    </MemoryRouter>
  );
  await screen.findByText("Forms");
  await submit();
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith(`${path.slice(1)}/room-sync`, {
      name: "Research",
      dls_syncids: [app.sync_id],
    })
  );
});
