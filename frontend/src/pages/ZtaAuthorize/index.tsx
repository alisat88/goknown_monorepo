import React, { FormEvent, useEffect, useState } from "react";

import api from "../../services/api";
import { callbackUrl, parseHandoff, strictRequest } from "./handoff";
import "./styles.css";

export default function ZtaAuthorize() {
  const [request] = useState(() => {
    try {
      return parseHandoff(
        window.location.hash,
        process.env.REACT_APP_ZTA_HANDOFF_CLIENT_ID || "",
        process.env.REACT_APP_ZTA_HANDOFF_REDIRECT_URI || ""
      );
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    window.history.replaceState(null, "", "/zta/authorize");
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!request || busy) return;
    setBusy(true);
    setError("");
    try {
      const base = api.defaults.baseURL || "";
      if (!challenge) {
        const started = await strictRequest(base, "challenges", {
          email,
          password,
        });
        if (!/^[A-Za-z0-9_-]{43}$/.test(started.challenge)) throw new Error();
        setChallenge(started.challenge);
      } else {
        // Strict proof exists only in this function's memory. Never use the legacy
        // dashboard JWT, persistent browser storage, or a URL for this credential.
        const session = await strictRequest(base, "verify", {
          challenge,
          code,
        });
        if (!/^dgs1_[A-Za-z0-9_-]{43}$/.test(session.token)) throw new Error();
        const authorized = await strictRequest(
          base,
          "handoff/authorize",
          request,
          session.token
        );
        window.location.replace(callbackUrl(request, authorized));
      }
    } catch {
      setError(
        "Sign-in could not be completed. Check your details or start again. The service may be unavailable."
      );
    } finally {
      setPassword("");
      setCode("");
      setBusy(false);
    }
  }

  return (
    <main className="zta-authorize" data-hj-suppress>
      <h1>Sign in to ZTA Coin</h1>
      {!request ? (
        <p role="alert">
          This sign-in request is invalid or unavailable. Return to ZTA Coin and
          start again.
        </p>
      ) : (
        <>
          <p>
            Verify your DAppGenius account to view your personal ZTA balance.
            This does not authorize transfers or minting.
          </p>
          <form onSubmit={submit}>
            {!challenge ? (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={busy}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={busy}
                  />
                </label>
              </>
            ) : (
              <label>
                Eight-digit email verification code
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{8}"
                  maxLength={8}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                  disabled={busy}
                />
              </label>
            )}
            <button type="submit" disabled={busy}>
              {busy
                ? "Verifying…"
                : challenge
                ? "Verify and continue to ZTA Coin"
                : "Send verification code"}
            </button>
            {challenge && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setChallenge("");
                  setCode("");
                  setError("");
                }}
              >
                Start again
              </button>
            )}
          </form>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </main>
  );
}
