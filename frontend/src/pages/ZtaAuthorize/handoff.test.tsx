import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ZtaAuthorize from "./index";
import { callbackUrl, parseHandoff, strictRequest } from "./handoff";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { defaults: { baseURL: "https://api.dappgenius.test" } },
}));
const client = "zta-web";
const redirect = "https://zta-coin.org/auth/callback";
const state = "S".repeat(32);
const params = new URLSearchParams({
  client_id: client,
  redirect_uri: redirect,
  state,
  code_challenge: "C".repeat(43),
});
const originalLocation = window.location;
const fetcher = jest.fn();
const navigate = jest.fn();
beforeEach(() => {
  fetcher.mockReset();
  navigate.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      hash: `#${params}`,
      hostname: "dappgenius.dev",
      replace: navigate,
    },
  });
  jest
    .spyOn(window.history, "replaceState")
    .mockImplementation(() => undefined);
  Object.defineProperty(window, "fetch", {
    configurable: true,
    writable: true,
    value: fetcher,
  });
  process.env.REACT_APP_ZTA_HANDOFF_CLIENT_ID = client;
  process.env.REACT_APP_ZTA_HANDOFF_REDIRECT_URI = redirect;
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});
const response = (data: unknown) => ({ ok: true, json: async () => data });

test("accepts only configured client and callback, with unique parameters", () => {
  const request = parseHandoff(`#${params}`, client, redirect);
  expect(request.redirect_uri).toBe(redirect);
  for (const fragment of [
    `#${params}&state=extra`,
    `#${params}&account_id=other`,
    `#${params}`.replace("zta-web", "attacker"),
    `#${params}`.replace("zta-coin.org", "evil.example"),
  ]) {
    expect(() => parseHandoff(fragment, client, redirect)).toThrow();
  }
  expect(() =>
    parseHandoff(`#${params}`, client, "http://zta-coin.org/auth/callback")
  ).toThrow();
  expect(() =>
    callbackUrl(request, { code: "A".repeat(43), state: "other" })
  ).toThrow();
  const callback = new URL(
    callbackUrl(request, { code: "A".repeat(43), state })
  );
  expect(callback.origin).toBe("https://zta-coin.org");
  expect(callback.search).toBe("");
  expect(
    Array.from(new URLSearchParams(callback.hash.slice(1)).keys())
  ).toEqual(["code", "state"]);
});

test("strict request does not accept a legacy JWT or send browser cookies", async () => {
  await expect(
    strictRequest(
      "https://api.dappgenius.test",
      "handoff/authorize",
      {},
      "legacy.jwt.token"
    )
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
  fetcher.mockResolvedValue(response({}));
  await strictRequest(
    "https://api.dappgenius.test",
    "handoff/authorize",
    {},
    `dgs1_${"T".repeat(43)}`
  );
  expect(fetcher).toHaveBeenCalledWith(
    "https://api.dappgenius.test/strict-sessions/handoff/authorize",
    expect.objectContaining({
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
    })
  );
});

test("password, email verification and authorization return only a one-time code", async () => {
  localStorage.setItem("@GoKnown:token", "legacy.jwt");
  fetcher
    .mockResolvedValueOnce(response({ challenge: "H".repeat(43) }))
    .mockResolvedValueOnce(response({ token: `dgs1_${"T".repeat(43)}` }))
    .mockResolvedValueOnce(response({ code: "A".repeat(43), state }));
  render(<ZtaAuthorize />);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "user@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "local-test-password" },
  });
  fireEvent.click(screen.getByText("Send verification code"));
  fireEvent.change(
    await screen.findByLabelText("Eight-digit email verification code"),
    { target: { value: "12345678" } }
  );
  fireEvent.click(screen.getByText("Verify and continue to ZTA Coin"));
  await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBeUndefined();
  expect(fetcher.mock.calls[2][1].headers.Authorization).toBe(
    `Bearer dgs1_${"T".repeat(43)}`
  );
  expect(navigate.mock.calls[0][0]).not.toMatch(
    /dgs1_|legacy|password|code_verifier/
  );
  expect(sessionStorage.length).toBe(0);
  expect(localStorage.length).toBe(1);
});

test("disabled or unavailable strict sessions never navigate or fall back to legacy login", async () => {
  fetcher.mockResolvedValue({ ok: false, status: 404 });
  render(<ZtaAuthorize />);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "user@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "local-test-password" },
  });
  fireEvent.click(screen.getByText("Send verification code"));
  await screen.findByRole("alert");
  expect(navigate).not.toHaveBeenCalled();
  expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe(
    ""
  );
});
