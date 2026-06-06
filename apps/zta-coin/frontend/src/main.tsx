import React, { FormEvent, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Activity,
  ArrowRightLeft,
  Coins,
  Gauge,
  LayoutDashboard,
  Menu,
  RadioTower,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import "./styles.css";

const API_URL =
  import.meta.env.VITE_ZTA_API_URL ?? "https://dappgenius-demo-1.onrender.com";
const DAPPGENIUS_DASHBOARD_URL =
  import.meta.env.VITE_DAPPGENIUS_DASHBOARD_URL ?? "https://dappgenius.dev";

const DEMO_USERS = ["Mike", "Connie", "Chuck", "Chand", "Alisa"] as const;
const MINT_ISSUER_ACCOUNT = "KN_ISSUER";
const MINT_RESERVE_ACCOUNT = "KNOWN_SYSTEM";

type DemoUser = (typeof DEMO_USERS)[number];

type RequestState = {
  loading: boolean;
  success: string;
  error: string;
  raw: unknown;
};

type VelocityResponse = {
  last1minVolume?: number;
  last5minVolume?: number;
  last1hrVolume?: number;
  txCountLast5min?: number;
  isSuspicious?: boolean;
  [key: string]: unknown;
};

const idleRequest: RequestState = {
  loading: false,
  success: "",
  error: "",
  raw: null,
};

async function requestJson(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String(body.error)
        : `Request failed with status ${response.status}`;
    throw Object.assign(new Error(message), { body });
  }

  return body;
}

function formatNumber(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function RawResponse({ state }: { state: RequestState }) {
  if (state.loading) {
    return <div className="response loading">Waiting for backend response...</div>;
  }

  if (!state.success && !state.error && !state.raw) {
    return <div className="response muted">Raw response will appear here.</div>;
  }

  return (
    <div className="response-stack">
      {state.success ? <div className="notice success">{state.success}</div> : null}
      {state.error ? <div className="notice error">{state.error}</div> : null}
      <pre className="response">
        {typeof state.raw === "string"
          ? state.raw
          : JSON.stringify(state.raw, null, 2)}
      </pre>
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mintAmount, setMintAmount] = useState(100);
  const [transferFrom, setTransferFrom] = useState<DemoUser>("Mike");
  const [transferTo, setTransferTo] = useState<DemoUser>("Connie");
  const [transferAmount, setTransferAmount] = useState(25);
  const [velocityAccount, setVelocityAccount] = useState<DemoUser>("Mike");
  const [mintState, setMintState] = useState<RequestState>(idleRequest);
  const [transferState, setTransferState] = useState<RequestState>(idleRequest);
  const [velocityState, setVelocityState] = useState<RequestState>(idleRequest);
  const [healthState, setHealthState] = useState<RequestState>(idleRequest);

  const velocity = velocityState.raw as VelocityResponse | null;
  const transferInvalid = transferFrom === transferTo;

  const activeRequestCount = useMemo(
    () =>
      [mintState, transferState, velocityState, healthState].filter(
        (state) => state.loading,
      ).length,
    [mintState, transferState, velocityState, healthState],
  );

  async function submitMint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMintState({ ...idleRequest, loading: true });

    try {
      const raw = await requestJson("/mint", {
        method: "POST",
        body: JSON.stringify({
          user_id: MINT_ISSUER_ACCOUNT,
          amount: mintAmount,
        }),
      });
      setMintState({
        loading: false,
        success: `Minted ${mintAmount} ZTA into ${MINT_RESERVE_ACCOUNT}.`,
        error: "",
        raw,
      });
    } catch (error) {
      setMintState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to mint tokens.",
        raw: (error as { body?: unknown }).body ?? null,
      });
    }
  }

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (transferInvalid) {
      setTransferState({
        loading: false,
        success: "",
        error: "Sender and receiver must be different demo users.",
        raw: { from_user: transferFrom, to_user: transferTo },
      });
      return;
    }

    setTransferState({ ...idleRequest, loading: true });

    try {
      const raw = await requestJson("/transfer", {
        method: "POST",
        body: JSON.stringify({
          from_user: transferFrom,
          to_user: transferTo,
          amount: transferAmount,
        }),
      });
      setTransferState({
        loading: false,
        success: `Transferred ${transferAmount} ZTA from ${transferFrom} to ${transferTo}.`,
        error: "",
        raw,
      });
    } catch (error) {
      setTransferState({
        loading: false,
        success: "",
        error:
          error instanceof Error ? error.message : "Unable to transfer tokens.",
        raw: (error as { body?: unknown }).body ?? null,
      });
    }
  }

  async function loadVelocity() {
    setVelocityState({ ...idleRequest, loading: true });

    try {
      const raw = await requestJson(`/velocity/${encodeURIComponent(velocityAccount)}`);
      setVelocityState({
        loading: false,
        success: `Loaded velocity for ${velocityAccount}.`,
        error: "",
        raw,
      });
    } catch (error) {
      setVelocityState({
        loading: false,
        success: "",
        error:
          error instanceof Error ? error.message : "Unable to load velocity.",
        raw: (error as { body?: unknown }).body ?? null,
      });
    }
  }

  async function loadHealth() {
    setHealthState({ ...idleRequest, loading: true });

    try {
      const raw = await requestJson("/health");
      setHealthState({
        loading: false,
        success: "Backend health check completed.",
        error: "",
        raw,
      });
    } catch (error) {
      setHealthState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to check health.",
        raw: (error as { body?: unknown }).body ?? null,
      });
    }
  }

  return (
    <div className="app">
      <button
        className="mobile-menu"
        type="button"
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">Z</div>
          <div>
            <strong>ZTA Coin</strong>
            <span>GoKnown ledger</span>
          </div>
        </div>
        <nav className="nav">
          <a className="nav-item active" href="#overview">
            <LayoutDashboard />
            Overview
          </a>
          <a className="nav-item" href="#mint">
            <Coins />
            Mint
          </a>
          <a className="nav-item" href="#transfer">
            <ArrowRightLeft />
            Transfer
          </a>
          <a className="nav-item" href="#velocity">
            <Gauge />
            Velocity
          </a>
          <a className="nav-item" href="#health">
            <RadioTower />
            Health
          </a>
        </nav>
        <div className="sidebar-footer">
          <span>API endpoint</span>
          <code>{API_URL}</code>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span>ZTA Coin operations</span>
            <h1>Secure token dashboard</h1>
          </div>
          <div className="topbar-actions">
            <a className="dashboard-link" href={DAPPGENIUS_DASHBOARD_URL}>
              ← Back to DAppGenius Dashboard
            </a>
            <div className="topbar-status">
              <Activity />
              {activeRequestCount > 0 ? `${activeRequestCount} request active` : "System ready"}
            </div>
          </div>
        </header>

        <section className="content" id="overview">
          <div className="metrics">
            <article className="metric-card">
              <div>
                <span>Secured ledger</span>
                <strong>ZTA</strong>
                <p>Demo users locked to approved account IDs.</p>
              </div>
              <ShieldCheck />
            </article>
            <article className="metric-card">
              <div>
                <span>System active</span>
                <strong>{healthState.success ? "Online" : "Ready"}</strong>
                <p>Health endpoint available for live backend checks.</p>
              </div>
              <RadioTower />
            </article>
            <article className="metric-card">
              <div>
                <span>Demo users</span>
                <strong>{DEMO_USERS.length}</strong>
                <p>Mike, Connie, Chuck, Chand, and Alisa.</p>
              </div>
              <WalletCards />
            </article>
          </div>

          <div className="panel-grid">
            <section className="panel" id="mint">
              <div className="panel-header">
                <div>
                  <span>Mint token</span>
                  <h2>Issue ZTA reserve</h2>
                </div>
                <Coins />
              </div>
              <form onSubmit={submitMint}>
                <label>
                  Authorized issuer
                  <input value={MINT_ISSUER_ACCOUNT} readOnly />
                </label>
                <label>
                  Destination reserve
                  <input value={MINT_RESERVE_ACCOUNT} readOnly />
                </label>
                <label>
                  Amount
                  <input
                    min="1"
                    step="1"
                    type="number"
                    value={mintAmount}
                    onChange={(event) => setMintAmount(Number(event.target.value))}
                  />
                </label>
                <button type="submit" disabled={mintState.loading || mintAmount < 1}>
                  {mintState.loading ? "Minting..." : "Mint tokens"}
                </button>
              </form>
              <RawResponse state={mintState} />
            </section>

            <section className="panel" id="transfer">
              <div className="panel-header">
                <div>
                  <span>Transfer token</span>
                  <h2>Move ZTA between users</h2>
                </div>
                <ArrowRightLeft />
              </div>
              <form onSubmit={submitTransfer}>
                <div className="form-row">
                  <label>
                    Sender
                    <select
                      value={transferFrom}
                      onChange={(event) =>
                        setTransferFrom(event.target.value as DemoUser)
                      }
                    >
                      {DEMO_USERS.map((user) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Receiver
                    <select
                      value={transferTo}
                      onChange={(event) =>
                        setTransferTo(event.target.value as DemoUser)
                      }
                    >
                      {DEMO_USERS.map((user) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {transferInvalid ? (
                  <p className="field-error">Sender and receiver must be different.</p>
                ) : null}
                <label>
                  Amount
                  <input
                    min="1"
                    step="1"
                    type="number"
                    value={transferAmount}
                    onChange={(event) =>
                      setTransferAmount(Number(event.target.value))
                    }
                  />
                </label>
                <button
                  type="submit"
                  disabled={
                    transferState.loading || transferAmount < 1 || transferInvalid
                  }
                >
                  {transferState.loading ? "Transferring..." : "Transfer tokens"}
                </button>
              </form>
              <RawResponse state={transferState} />
            </section>
          </div>

          <div className="panel-grid wide">
            <section className="panel" id="velocity">
              <div className="panel-header">
                <div>
                  <span>Account velocity</span>
                  <h2>Transaction activity profile</h2>
                </div>
                <Gauge />
              </div>
              <div className="toolbar">
                <label>
                  Account
                  <select
                    value={velocityAccount}
                    onChange={(event) =>
                      setVelocityAccount(event.target.value as DemoUser)
                    }
                  >
                    {DEMO_USERS.map((user) => (
                      <option key={user} value={user}>
                        {user}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={loadVelocity} disabled={velocityState.loading}>
                  {velocityState.loading ? "Loading..." : "Load velocity"}
                </button>
              </div>
              <div className="velocity-grid">
                <div>
                  <span>Last 1 min volume</span>
                  <strong>{formatNumber(velocity?.last1minVolume)}</strong>
                </div>
                <div>
                  <span>Last 5 min volume</span>
                  <strong>{formatNumber(velocity?.last5minVolume)}</strong>
                </div>
                <div>
                  <span>Last 1 hr volume</span>
                  <strong>{formatNumber(velocity?.last1hrVolume)}</strong>
                </div>
                <div>
                  <span>Tx count last 5 min</span>
                  <strong>{formatNumber(velocity?.txCountLast5min)}</strong>
                </div>
                <div className={velocity?.isSuspicious ? "flag danger" : "flag"}>
                  <span>Suspicious</span>
                  <strong>{velocity?.isSuspicious ? "Yes" : "No"}</strong>
                </div>
              </div>
              <RawResponse state={velocityState} />
            </section>

            <section className="panel" id="health">
              <div className="panel-header">
                <div>
                  <span>Backend health</span>
                  <h2>Runtime connectivity</h2>
                </div>
                <RadioTower />
              </div>
              <button type="button" onClick={loadHealth} disabled={healthState.loading}>
                {healthState.loading ? "Checking..." : "Check backend"}
              </button>
              <RawResponse state={healthState} />
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
