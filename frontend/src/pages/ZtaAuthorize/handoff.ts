export type HandoffRequest = {
  client_id: string;
  redirect_uri: string;
  state: string;
  code_challenge: string;
};

export function parseHandoff(
  fragment: string,
  clientId: string,
  redirectUri: string
): HandoffRequest {
  const configured = new URL(redirectUri);
  if (
    !clientId ||
    configured.protocol !== "https:" ||
    configured.username ||
    configured.password ||
    configured.search ||
    configured.hash ||
    configured.pathname !== "/auth/callback"
  )
    throw new Error("Sign-in unavailable");
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  const keys = ["client_id", "redirect_uri", "state", "code_challenge"];
  if (
    Array.from(params.keys()).length !== keys.length ||
    keys.some((key) => params.getAll(key).length !== 1) ||
    params.get("client_id") !== clientId ||
    params.get("redirect_uri") !== redirectUri ||
    !/^[A-Za-z0-9_-]{32}$/.test(params.get("state") || "") ||
    !/^[A-Za-z0-9_-]{43}$/.test(params.get("code_challenge") || "")
  )
    throw new Error("Invalid sign-in request");
  return {
    client_id: clientId,
    redirect_uri: redirectUri,
    state: params.get("state") || "",
    code_challenge: params.get("code_challenge") || "",
  };
}

export async function strictRequest(
  base: string,
  path: string,
  body: unknown,
  token?: string
) {
  const url = new URL(base);
  const local =
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !local) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("Sign-in unavailable");
  if (token && !/^dgs1_[A-Za-z0-9_-]{43}$/.test(token))
    throw new Error("Invalid session");
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      `${base.replace(/\/$/, "")}/strict-sessions/${path}`,
      {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok)
      throw new Error(
        "Unable to verify sign-in. Check your details or try again later."
      );
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

export function callbackUrl(
  request: HandoffRequest,
  result: { code: string; state: string }
) {
  if (
    !result ||
    result.state !== request.state ||
    !/^[A-Za-z0-9_-]{43}$/.test(result.code)
  )
    throw new Error("Invalid authorization response");
  const url = new URL(request.redirect_uri);
  url.hash = new URLSearchParams({
    code: result.code,
    state: result.state,
  }).toString();
  return url.href;
}
