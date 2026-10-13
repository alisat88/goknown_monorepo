export type BalanceState =
  | { kind: "loading" | "signed-out" | "expired" | "unavailable" }
  | { kind: "ready"; balance: string };

export class SessionRequired extends Error {}
export const TRANSACTION_KEY = "zta.handoff.transaction";
export const CALLBACK_PATH = "/auth/callback";
export type Config = {
  apiBase: string;
  origin: string;
  clientId: string;
  authorizeUrl: string;
};

export function apiEndpoint(config: Config, path: string) {
  const origin = new URL(config.origin);
  const api = new URL(config.apiBase || "/", origin);
  const local = ["localhost", "127.0.0.1"].includes(origin.hostname);
  const sameSite =
    api.origin === origin.origin ||
    (api.protocol === origin.protocol &&
      (api.hostname === origin.hostname ||
        (origin.hostname === "zta-coin.org" &&
          api.hostname === "api.zta-coin.org")));
  if (
    !sameSite ||
    (api.protocol !== "https:" && !local) ||
    api.username ||
    api.password ||
    api.search ||
    api.hash
  ) {
    throw new Error("Invalid API configuration");
  }
  return `${api.href.replace(/\/$/, "")}${path}`;
}

async function request(config: Config, path: string, body?: unknown) {
  const response = await fetch(apiEndpoint(config, path), {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    cache: "no-store",
    redirect: "error",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(10000),
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (response.status === 401) throw new SessionRequired();
  if (!response.ok) throw new Error("Service unavailable");
  return response.status === 204 ? undefined : response.json();
}

export async function loadBalance(config: Config): Promise<string> {
  const body = await request(config, "/me/balance");
  // Keep PostgreSQL numeric values as strings; never round through Number.
  if (
    !body ||
    typeof body.balance !== "string" ||
    !/^\d{1,22}\.\d{8}$/.test(body.balance)
  ) {
    throw new Error("Invalid balance response");
  }
  return body.balance;
}

export async function beginHandoff(
  config: Config,
  storage: Storage,
  navigate: (url: string) => void
) {
  const authorize = new URL(config.authorizeUrl);
  if (
    !config.clientId ||
    authorize.protocol !== "https:" ||
    authorize.username ||
    authorize.password ||
    authorize.search ||
    authorize.hash
  ) {
    throw new Error("Sign-in unavailable");
  }
  const redirectUri = new URL(CALLBACK_PATH, config.origin).href;
  const tx = await request(config, "/auth/handoff/start", {
    client_id: config.clientId,
    redirect_uri: redirectUri,
  });
  if (
    !tx ||
    !/^[A-Za-z0-9_-]{32}$/.test(tx.state) ||
    !/^[A-Za-z0-9_-]{43}$/.test(tx.codeVerifier) ||
    tx.clientId !== config.clientId ||
    tx.redirectUri !== redirectUri ||
    tx.expiresInSeconds !== 300
  ) {
    throw new Error("Invalid transaction");
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(tx.codeVerifier)
  );
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  storage.setItem(
    TRANSACTION_KEY,
    JSON.stringify({
      ...tx,
      apiBase: config.apiBase,
      expiresAt: Date.now() + 300000,
    })
  );
  authorize.hash = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    state: tx.state,
    code_challenge: challenge,
  }).toString();
  navigate(authorize.href);
}

export async function finishHandoff(
  config: Config,
  fragment: string,
  storage: Storage
) {
  const saved = storage.getItem(TRANSACTION_KEY);
  storage.removeItem(TRANSACTION_KEY); // Single attempt; never retain a verifier after callback.
  if (!saved) throw new SessionRequired();
  let tx;
  try {
    tx = JSON.parse(saved);
  } catch {
    throw new SessionRequired();
  }
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  if (
    !tx ||
    typeof tx !== "object" ||
    Array.from(params.keys()).length !== 2 ||
    params.getAll("code").length !== 1 ||
    params.getAll("state").length !== 1 ||
    !/^[A-Za-z0-9_-]{43}$/.test(params.get("code") || "") ||
    params.get("state") !== tx.state ||
    !Number.isFinite(tx.expiresAt) ||
    tx.expiresAt <= Date.now() ||
    tx.expiresAt > Date.now() + 300000 ||
    tx.clientId !== config.clientId ||
    tx.apiBase !== config.apiBase ||
    tx.redirectUri !== new URL(CALLBACK_PATH, config.origin).href ||
    typeof tx.codeVerifier !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(tx.codeVerifier)
  ) {
    throw new SessionRequired();
  }
  await request(config, "/auth/handoff/redeem", {
    code: params.get("code"),
    client_id: tx.clientId,
    redirect_uri: tx.redirectUri,
    state: tx.state,
    code_verifier: tx.codeVerifier,
  });
}

// Run once outside React effects so StrictMode cannot redeem a one-time code twice.
export function consumeCallback(config: Config): Promise<void> | undefined {
  if (window.location.pathname !== CALLBACK_PATH) return undefined;
  const fragment = window.location.hash;
  window.history.replaceState(null, "", "/");
  return finishHandoff(config, fragment, window.sessionStorage);
}
