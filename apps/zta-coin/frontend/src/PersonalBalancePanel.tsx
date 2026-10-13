import React, { useEffect, useRef, useState } from "react";
import {
  BalanceState,
  Config,
  SessionRequired,
  beginHandoff,
  loadBalance,
} from "./personalBalance";

export function PersonalBalance({
  config,
  callback,
}: {
  config: Config;
  callback?: Promise<void>;
}) {
  const [state, setState] = useState<BalanceState>({ kind: "loading" });
  const [starting, setStarting] = useState(false);
  const [signInError, setSignInError] = useState(false);
  const authenticated = useRef(false);
  const generation = useRef(0);

  async function refresh() {
    const current = ++generation.current;
    setState({ kind: "loading" });
    try {
      await callback;
      const balance = await loadBalance(config);
      if (current !== generation.current) return;
      authenticated.current = true;
      setState({ kind: "ready", balance });
    } catch (error) {
      if (current !== generation.current) return;
      setState({
        kind:
          error instanceof SessionRequired
            ? authenticated.current || callback
              ? "expired"
              : "signed-out"
            : "unavailable",
      });
    }
  }

  useEffect(() => {
    void refresh();
    const focus = () => {
      void refresh();
    };
    const interval = window.setInterval(focus, 60000);
    window.addEventListener("focus", focus);
    // Clear a balance from the back/forward cache before it can reappear.
    const hide = () => {
      generation.current++;
      setState({ kind: "loading" });
    };
    const show = (event: PageTransitionEvent) => {
      if (event.persisted) focus();
    };
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);
    return () => {
      generation.current++;
      window.clearInterval(interval);
      window.removeEventListener("focus", focus);
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", show);
    };
  }, [config, callback]);

  async function signIn() {
    if (starting) return;
    setStarting(true);
    setSignInError(false);
    try {
      await beginHandoff(config, window.sessionStorage, (url) =>
        window.location.assign(url)
      );
    } catch {
      setStarting(false);
      setSignInError(true);
    }
  }

  const messages = {
    loading: "Loading your balance…",
    "signed-out": "Sign in to see your personal ZTA balance.",
    expired: "Your session expired or is no longer valid. Sign in again.",
    unavailable: "Your balance is temporarily unavailable. Please try again.",
  };
  return (
    <section
      className="panel personal-balance"
      aria-label="Personal ZTA balance"
    >
      <div className="panel-header">
        <div>
          <span>Your account</span>
          <h2>Personal balance</h2>
        </div>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-busy={state.kind === "loading"}
      >
        {state.kind === "ready" ? (
          <strong className="personal-balance-value">
            {state.balance} ZTA
          </strong>
        ) : (
          <p>{messages[state.kind]}</p>
        )}
      </div>
      <div className="personal-balance-actions">
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={state.kind === "loading" || starting}
        >
          Refresh balance
        </button>
        {state.kind !== "ready" && state.kind !== "loading" && (
          <button
            type="button"
            onClick={() => void signIn()}
            disabled={starting || !config.clientId || !config.authorizeUrl}
          >
            {starting ? "Opening sign-in…" : "Sign in with DAppGenius"}
          </button>
        )}
      </div>
      {!config.clientId || !config.authorizeUrl ? (
        <p>Sign-in is not yet available in this environment.</p>
      ) : null}
      {signInError && (
        <p role="alert">Sign-in is unavailable. Please try again later.</p>
      )}
    </section>
  );
}
