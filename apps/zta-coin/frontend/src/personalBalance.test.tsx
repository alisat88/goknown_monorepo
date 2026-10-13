import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { webcrypto } from "node:crypto";
import { PersonalBalance } from "./PersonalBalancePanel";
import {
  apiEndpoint,
  beginHandoff,
  finishHandoff,
  loadBalance,
  TRANSACTION_KEY,
} from "./personalBalance";

const config = {
  apiBase: "https://api.zta-coin.org",
  origin: "https://zta-coin.org",
  clientId: "zta-web",
  authorizeUrl: "https://dappgenius.dev/zta/authorize",
};
const reply = (status: number, body: unknown = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  vi.stubGlobal("crypto", webcrypto);
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("personal balance", () => {
  it("shows loading with no invented balance", () => {
    fetcher.mockReturnValue(new Promise(() => {}));
    render(<PersonalBalance config={config} />);
    expect(screen.getByRole("status").textContent).toContain(
      "Loading your balance"
    );
    expect(screen.queryByText(/0\.00000000/)).toBeNull();
  });
  it.each(["0.00000000", "12.34000000", "9999999999999999999999.12345678"])(
    "renders exact server string %s with only a credentialed /me/balance request",
    async (balance) => {
      fetcher.mockResolvedValue(
        reply(200, { balance, accountId: "server-owned" })
      );
      render(<PersonalBalance config={config} />);
      expect(await screen.findByText(`${balance} ZTA`)).toBeTruthy();
      expect(fetcher).toHaveBeenCalledWith(
        "https://api.zta-coin.org/me/balance",
        expect.objectContaining({
          credentials: "include",
          cache: "no-store",
          method: "GET",
          redirect: "error",
        })
      );
      expect(fetcher.mock.calls[0][1].body).toBeUndefined();
      expect(screen.queryByRole("combobox")).toBeNull();
    }
  );
  it("distinguishes signed-out from a session lost after success", async () => {
    fetcher
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, { balance: "1.00000000" }))
      .mockResolvedValueOnce(reply(401));
    render(<PersonalBalance config={config} />);
    expect(
      await screen.findByText("Sign in to see your personal ZTA balance.")
    ).toBeTruthy();
    fireEvent.click(screen.getByText("Refresh balance"));
    await screen.findByText("1.00000000 ZTA");
    fireEvent.click(screen.getByText("Refresh balance"));
    expect(await screen.findByText(/Your session expired/)).toBeTruthy();
    expect(screen.queryByText("1.00000000 ZTA")).toBeNull();
    expect(screen.queryByText("0.00000000 ZTA")).toBeNull();
  });
  it.each([
    reply(503),
    reply(200, { balance: 0 }),
    reply(200, { balance: "1.234567891" }),
    reply(200, { balance: "1.2" }),
  ])("shows unavailable for failures and invalid data", async (response) => {
    fetcher.mockResolvedValue(response);
    render(<PersonalBalance config={config} />);
    expect(await screen.findByText(/temporarily unavailable/)).toBeTruthy();
    expect(screen.queryByText(/0\.00000000/)).toBeNull();
  });
  it("clears a previous balance on a network failure", async () => {
    fetcher
      .mockResolvedValueOnce(reply(200, { balance: "7.00000000" }))
      .mockRejectedValueOnce(new TypeError("Network error"));
    render(<PersonalBalance config={config} />);
    await screen.findByText("7.00000000 ZTA");
    fireEvent.click(screen.getByText("Refresh balance"));
    await screen.findByText(/temporarily unavailable/);
    expect(screen.queryByText("7.00000000 ZTA")).toBeNull();
  });
  it("does not make cross-site cookie requests", async () => {
    await expect(
      loadBalance({ ...config, apiBase: "https://dappgenius.dev" })
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    expect(apiEndpoint({ ...config, apiBase: "/api" }, "/me/balance")).toBe(
      "https://zta-coin.org/api/me/balance"
    );
  });
});

describe("browser navigation and PKCE", () => {
  const tx = {
    state: "S".repeat(32),
    codeVerifier: "V".repeat(43),
    clientId: config.clientId,
    redirectUri: "https://zta-coin.org/auth/callback",
    expiresInSeconds: 300,
  };
  async function start() {
    fetcher.mockResolvedValueOnce(reply(200, tx));
    const navigate = vi.fn();
    await beginHandoff(config, sessionStorage, navigate);
    return new URL(navigate.mock.calls[0][0]);
  }
  it("navigates to DAppGenius with a challenge, then redeems only on the ZTA site", async () => {
    const url = await start();
    expect(url.origin).toBe("https://dappgenius.dev");
    expect(url.search).toBe("");
    expect(url.href).not.toContain(tx.codeVerifier);
    const params = new URLSearchParams(url.hash.slice(1));
    const expected = Buffer.from(
      await webcrypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(tx.codeVerifier)
      )
    ).toString("base64url");
    expect(params.get("code_challenge")).toBe(expected);
    fetcher.mockResolvedValueOnce(reply(204));
    await finishHandoff(
      config,
      `#code=${"C".repeat(43)}&state=${tx.state}`,
      sessionStorage
    );
    expect(fetcher.mock.calls[1][0]).toBe(
      "https://api.zta-coin.org/auth/handoff/redeem"
    );
    expect(fetcher.mock.calls[1][1].credentials).toBe("include");
    expect(JSON.parse(fetcher.mock.calls[1][1].body).code_verifier).toBe(
      tx.codeVerifier
    );
    expect(sessionStorage.getItem(TRANSACTION_KEY)).toBeNull();
    await expect(
      finishHandoff(
        config,
        `#code=${"C".repeat(43)}&state=${tx.state}`,
        sessionStorage
      )
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it.each([
    "missing",
    "expired",
    "substituted",
    "duplicate",
    "wrong-api",
    "corrupt",
  ])("rejects %s callback before redemption", async (mode) => {
    await start();
    if (mode === "missing") sessionStorage.clear();
    if (mode === "corrupt") sessionStorage.setItem(TRANSACTION_KEY, "null");
    if (mode === "expired") {
      const saved = JSON.parse(sessionStorage.getItem(TRANSACTION_KEY)!);
      saved.expiresAt = 0;
      sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(saved));
    }
    const state = mode === "substituted" ? "wrong" : tx.state;
    const fragment = `#code=${"C".repeat(43)}&state=${state}${
      mode === "duplicate" ? "&code=extra" : ""
    }`;
    await expect(
      finishHandoff(
        mode === "wrong-api" ? { ...config, apiBase: "/api" } : config,
        fragment,
        sessionStorage
      )
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(TRANSACTION_KEY)).toBeNull();
  });
  it("handles a rejected callback without displaying a balance", async () => {
    const callback = Promise.reject(new Error("Unavailable"));
    render(<PersonalBalance config={config} callback={callback} />);
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "temporarily unavailable"
      )
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
