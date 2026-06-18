import React, { FormEvent, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Activity,
  ArrowRightLeft,
  Coins,
  Gauge,
  LayoutDashboard,
  Menu,
  RadioTower,
  RefreshCw,
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

type LedgerTransaction = {
  id?: string;
  transactionId?: string;
  timestamp?: string;
  type?: string;
  eventCode?: string;
  from?: string | null;
  to?: string | null;
  amount?: number;
  status?: string;
  note?: string;
};

type LedgerState = {
  loading: boolean;
  error: string;
  transactions: LedgerTransaction[];
};

type TransferConsensus = {
  proposalId?: string;
  status?: string;
  approvalCount?: number;
  rejectionCount?: number;
};

type TransferResponse = {
  consensus?: TransferConsensus;
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

function formatAmount(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0.00 ZTA";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ZTA`;
}

function formatTimestamp(value?: string) {
  if (!value) return "—";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function shortId(value?: string) {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
}

function getTransactionKind(transaction: LedgerTransaction) {
  return transaction.type === "Mint" || transaction.eventCode === "KN-MNT-000"
    ? "Mint"
    : "Transfer";
}

function getTransferResponse(raw: unknown): TransferResponse | null {
  return typeof raw === "object" && raw !== null ? (raw as TransferResponse) : null;
}

function formatConsensusStatus(status?: string) {
  if (!status) return "Unknown";

  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function TransferConsensusPanel({ state }: { state: RequestState }) {
  if (!state.success || state.error || state.loading) return null;

  const response = getTransferResponse(state.raw);
  const consensus = response?.consensus;

  if (!consensus) {
    return (
      <div className="consensus-card muted">
        Consensus details not returned for this transfer.
      </div>
    );
  }

  const approvalCount =
    typeof consensus.approvalCount === "number" ? consensus.approvalCount : 0;
  const rejectionCount =
    typeof consensus.rejectionCount === "number" ? consensus.rejectionCount : 0;
  const statusLabel = formatConsensusStatus(consensus.status);
  const headline =
    statusLabel === "Approved"
      ? `Approved by ${approvalCount}/3 nodes`
      : statusLabel;

  return (
    <div className="consensus-card">
      <div className="consensus-header">
        <ShieldCheck />
        <div>
          <span>BFT Consensus</span>
          <strong>{headline}</strong>
        </div>
      </div>
      <p>Proposal finalized through the three-node quorum layer.</p>
      <dl className="consensus-details">
        <div>
          <dt>Status</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div>
          <dt>Approval count</dt>
          <dd>{approvalCount}</dd>
        </div>
        <div>
          <dt>Rejection count</dt>
          <dd>{rejectionCount}</dd>
        </div>
        <div className="proposal-id">
          <dt>Proposal ID</dt>
          <dd>{consensus.proposalId || "Not returned"}</dd>
        </div>
      </dl>
    </div>
  );
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
  const [ledgerState, setLedgerState] = useState<LedgerState>({
    loading: true,
    error: "",
    transactions: [],
  });

  const velocity = velocityState.raw as VelocityResponse | null;
  const transferInvalid = transferFrom === transferTo;

  const activeRequestCount = useMemo(
    () =>
      [mintState, transferState, velocityState, healthState].filter(
        (state) => state.loading,
      ).length,
    [mintState, transferState, velocityState, healthState],
  );

  async function loadLedger() {
    setLedgerState((state) => ({ ...state, loading: true, error: "" }));

    try {
      const raw = await requestJson("/ledger");
      const transactions = Array.isArray(raw) ? raw : [];

      setLedgerState({
        loading: false,
        error: "",
        transactions: transactions as LedgerTransaction[],
      });
    } catch {
      setLedgerState((state) => ({
        ...state,
        loading: false,
        error: "Ledger is temporarily unavailable. Try refreshing in a moment.",
      }));
    }
  }

  useEffect(() => {
    loadLedger();
  }, []);

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
      await loadLedger();
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
      await loadLedger();
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
          <a className="nav-item" href="#ledger">
            <Activity />
            Ledger
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
              <TransferConsensusPanel state={transferState} />
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

          <section className="panel ledger-panel" id="ledger">
            <div className="panel-header ledger-header">
              <div>
                <span>Complete token activity</span>
                <h2>Full Transaction Ledger</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={loadLedger}
                disabled={ledgerState.loading}
                aria-label="Refresh transaction ledger"
                title="Refresh transaction ledger"
              >
                <RefreshCw />
              </button>
            </div>

            {ledgerState.loading ? (
              <div className="ledger-state">Loading transaction ledger...</div>
            ) : ledgerState.error ? (
              <div className="ledger-state error">{ledgerState.error}</div>
            ) : ledgerState.transactions.length === 0 ? (
              <div className="ledger-state">
                No transactions yet. Mint or transfer ZTA Coin to populate the ledger.
              </div>
            ) : (
              <div className="ledger-table-wrap">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Type</th>
                      <th>Transaction ID</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Policy</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerState.transactions.map((transaction, index) => {
                      const kind = getTransactionKind(transaction);
                      const transactionId =
                        transaction.transactionId || transaction.id || "";

                      return (
                        <tr key={transactionId || `${transaction.timestamp}-${index}`}>
                          <td>{formatTimestamp(transaction.timestamp)}</td>
                          <td>
                            <span
                              className={`type-badge ${
                                kind === "Mint" ? "mint" : "transfer"
                              }`}
                            >
                              {kind}
                            </span>
                          </td>
                          <td>
                            <code title={transactionId}>
                              {shortId(transactionId)}
                            </code>
                          </td>
                          <td>{transaction.from || "—"}</td>
                          <td>{transaction.to || "—"}</td>
                          <td>{formatAmount(transaction.amount)}</td>
                          <td>
                            <span className="status-badge">
                              {transaction.status || "Completed"}
                            </span>
                          </td>
                          <td>{transaction.eventCode || "—"}</td>
                          <td>{transaction.note || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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
