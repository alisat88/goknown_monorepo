import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  CheckCircle2,
  Database,
  FileClock,
  FileSpreadsheet,
  Gauge,
  History,
  Loader2,
  Play,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Video,
  Workflow,
} from "lucide-react";
import "./styles.css";

const API_URL =
  import.meta.env.VITE_KNOWNCOMPUTE_API_URL ?? "http://127.0.0.1:8003";
const DAPPGENIUS_DASHBOARD_URL =
  import.meta.env.VITE_DAPPGENIUS_DASHBOARD_URL ?? "https://dappgenius.dev";

const DOMAINS = ["cybersecurity", "sessions", "transactions", "organizations"];

type View =
  | "live"
  | "governance"
  | "history"
  | "batch"
  | "admin"
  | "tutorials";

type Severity = "HIGH" | "MEDIUM" | "LOW";

type RequestState = {
  loading: boolean;
  success: string;
  error: string;
};

type HealthResponse = {
  status?: string;
};

type ModelResponse = {
  model_id: string;
  version: string;
};

type WorkflowResponse = {
  workflow_id: string;
  current_state: string;
};

type AllowedEventsResponse = {
  events: string[];
};

type ExecuteResponse = {
  new_state: string;
  severity: Severity;
};

type DomainSummary = Record<Severity, number>;
type GovernanceSummary = Record<string, DomainSummary>;

type HistoryRecord = {
  workflow_id: string;
  from_state: string;
  to_state: string;
  severity: Severity;
  normalized_score: number;
  archived: boolean;
  timestamp: string;
};

type CsvScore = {
  workflow_id: string;
  state_index: number;
  time_delta: number;
  raw_score: number;
  normalized_score: number;
  severity: Severity;
};

type AdminResetResponse = {
  status: string;
  archived_records?: number;
  deleted?: Record<string, number>;
};

const idleRequest: RequestState = {
  loading: false,
  success: "",
  error: "",
};

const tutorials = [
  ["Overview", "https://www.loom.com/share/fd970d33ffb3477392ad926f4f36b9ed"],
  ["Workflow 1", "https://www.loom.com/share/0be3e078110c4b8380361108d65643f5"],
  ["Anomaly Detection", "https://www.loom.com/share/da3a65d7d80743a5a6145e6066b797fc"],
  ["Admin", "https://www.loom.com/share/b42cb1b4832a4bc1bcaa9d7ddc80f529"],
  ["Architecture", "https://www.loom.com/share/4d48d976f13549d3af8388f05cb890c3"],
  ["Intro", "https://www.loom.com/share/797dbb8a71cf42f28870560f951d6e1c"],
  ["Workflow 2", "https://www.loom.com/share/cd0f710065fe458c9456f98fe689a877"],
  ["Dashboard", "https://www.loom.com/share/2390d5da10204d37afd4e331f302e597"],
  ["CSV", "https://www.loom.com/share/b6e989ae357147d996456c78e30a8f7c"],
  ["Use Cases", "https://www.loom.com/share/509b691fe44342678d1023cd6204ed33"],
] as const;

function endpoint(path: string) {
  return `${API_URL.replace(/\/$/, "")}${path}`;
}

function query(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const headers =
    options?.body instanceof FormData
      ? options.headers
      : { "Content-Type": "application/json", ...options?.headers };

  const response = await fetch(endpoint(path), {
    ...options,
    headers,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return body as T;
}

function severityClass(severity?: string) {
  if (severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  return "success";
}

function formatScore(score: number | undefined) {
  if (typeof score !== "number" || Number.isNaN(score)) return "0.000";
  return score.toFixed(3);
}

function formatTimestamp(timestamp: string) {
  if (!timestamp) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function App() {
  const [view, setView] = useState<View>("live");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState("");
  const [summary, setSummary] = useState<GovernanceSummary>({});
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [refreshState, setRefreshState] = useState<RequestState>(idleRequest);

  const [domain, setDomain] = useState(DOMAINS[0]);
  const [model, setModel] = useState<ModelResponse | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [allowedEvents, setAllowedEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [liveState, setLiveState] = useState<RequestState>(idleRequest);
  const [lastExecution, setLastExecution] = useState<ExecuteResponse | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvScores, setCsvScores] = useState<CsvScore[]>([]);
  const [csvState, setCsvState] = useState<RequestState>(idleRequest);

  const [adminState, setAdminState] = useState<RequestState>(idleRequest);
  const [adminResponse, setAdminResponse] = useState<AdminResetResponse | null>(null);

  const activeRecords = useMemo(
    () => history.filter((record) => !record.archived),
    [history],
  );

  const highAlert = useMemo(
    () =>
      [...activeRecords]
        .filter((record) => record.severity === "HIGH")
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )[0],
    [activeRecords],
  );

  const systemHealth = useMemo(() => {
    if (!activeRecords.length) return 100;
    const risk = activeRecords.reduce((total, record) => {
      if (record.severity === "HIGH") return total + 1;
      if (record.severity === "MEDIUM") return total + 0.5;
      return total;
    }, 0);
    return Math.max(0, Math.round(100 - (risk / activeRecords.length) * 100));
  }, [activeRecords]);

  async function refreshData() {
    setRefreshState({ ...idleRequest, loading: true });
    try {
      const [healthResult, summaryResult, historyResult] = await Promise.all([
        requestJson<HealthResponse>("/health"),
        requestJson<GovernanceSummary>("/analytics/by-domain"),
        requestJson<HistoryRecord[]>("/analytics/history"),
      ]);
      setHealth(healthResult);
      setHealthError("");
      setSummary(summaryResult);
      setHistory(historyResult);
      setRefreshState({ loading: false, success: "Dashboard refreshed.", error: "" });
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : "Backend unreachable.");
      setRefreshState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to refresh data.",
      });
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    setSelectedEvent(allowedEvents[0] ?? "");
  }, [allowedEvents]);

  async function generateModel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLiveState({ ...idleRequest, loading: true });
    setLastExecution(null);
    try {
      const result = await requestJson<ModelResponse>(
        `/model/generate?${query({ domain })}`,
        { method: "POST" },
      );
      setModel(result);
      setWorkflow(null);
      setAllowedEvents([]);
      setLiveState({
        loading: false,
        success: `Generated ${result.model_id} model ${result.version}.`,
        error: "",
      });
    } catch (error) {
      setLiveState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to generate model.",
      });
    }
  }

  async function activateModel() {
    if (!model) return;
    setLiveState({ ...idleRequest, loading: true });
    try {
      await requestJson<{ status: string }>(
        `/model/activate?${query({ model_id: model.model_id, version: model.version })}`,
        { method: "POST" },
      );
      setLiveState({
        loading: false,
        success: `Activated ${model.model_id} ${model.version}.`,
        error: "",
      });
      await refreshData();
    } catch (error) {
      setLiveState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to activate model.",
      });
    }
  }

  async function createWorkflow() {
    if (!model) return;
    setLiveState({ ...idleRequest, loading: true });
    try {
      const result = await requestJson<WorkflowResponse>(
        `/workflow/create?${query({ model_id: model.model_id, version: model.version })}`,
        { method: "POST" },
      );
      setWorkflow(result);
      setLiveState({
        loading: false,
        success: `Created workflow ${result.workflow_id}.`,
        error: "",
      });
      await loadAllowedEvents(result.workflow_id);
    } catch (error) {
      setLiveState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to create workflow.",
      });
    }
  }

  async function loadAllowedEvents(workflowId = workflow?.workflow_id) {
    if (!workflowId) return;
    setLiveState({ ...idleRequest, loading: true });
    try {
      const result = await requestJson<AllowedEventsResponse>(
        `/workflow/${encodeURIComponent(workflowId)}/allowed-events`,
      );
      setAllowedEvents(result.events);
      setLiveState({
        loading: false,
        success: result.events.length
          ? "Allowed events loaded."
          : "Workflow has no remaining allowed events.",
        error: "",
      });
    } catch (error) {
      setLiveState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to load events.",
      });
    }
  }

  async function executeSelectedEvent() {
    if (!workflow || !selectedEvent) return;
    setLiveState({ ...idleRequest, loading: true });
    try {
      const result = await requestJson<ExecuteResponse>(
        `/workflow/${encodeURIComponent(workflow.workflow_id)}/execute?${query({
          event: selectedEvent,
        })}`,
        { method: "POST" },
      );
      setWorkflow({ ...workflow, current_state: result.new_state });
      setLastExecution(result);
      setLiveState({
        loading: false,
        success: `Executed ${selectedEvent}; new state is ${result.new_state}.`,
        error: "",
      });
      await loadAllowedEvents(workflow.workflow_id);
      await refreshData();
    } catch (error) {
      setLiveState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to execute event.",
      });
    }
  }

  async function runCsvScoring() {
    if (!csvFile) {
      setCsvState({ loading: false, success: "", error: "Select a CSV file first." });
      return;
    }
    setCsvState({ ...idleRequest, loading: true });
    const formData = new FormData();
    formData.append("file", csvFile);
    try {
      const result = await requestJson<CsvScore[]>("/analytics/score-csv", {
        method: "POST",
        body: formData,
      });
      setCsvScores(result);
      setCsvState({
        loading: false,
        success: `Scored ${result.length} CSV rows.`,
        error: "",
      });
      await refreshData();
    } catch (error) {
      setCsvState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Unable to score CSV.",
      });
    }
  }

  async function runAdminReset(type: "soft" | "hard") {
    setAdminState({ ...idleRequest, loading: true });
    try {
      const result = await requestJson<AdminResetResponse>(
        type === "soft" ? "/admin/soft-reset" : "/admin/hard-reset",
        { method: "POST" },
      );
      setAdminResponse(result);
      setAdminState({
        loading: false,
        success: type === "soft" ? "Archived active audit records." : "Deleted demo data.",
        error: "",
      });
      await refreshData();
    } catch (error) {
      setAdminState({
        loading: false,
        success: "",
        error: error instanceof Error ? error.message : "Admin action failed.",
      });
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <ShieldCheck size={30} />
        </div>
        <div>
          <p className="eyebrow">GoKnown workspace</p>
          <h1>KnownCompute</h1>
        </div>
        <nav>
          <NavButton active={view === "live"} icon={<Workflow />} label="Live Execution" onClick={() => setView("live")} />
          <NavButton active={view === "governance"} icon={<Gauge />} label="Governance" onClick={() => setView("governance")} />
          <NavButton active={view === "history"} icon={<History />} label="Full History" onClick={() => setView("history")} />
          <NavButton active={view === "batch"} icon={<FileSpreadsheet />} label="Batch CSV" onClick={() => setView("batch")} />
          <NavButton active={view === "admin"} icon={<Database />} label="Admin Controls" onClick={() => setView("admin")} />
          <NavButton active={view === "tutorials"} icon={<Video />} label="Tutorials" onClick={() => setView("tutorials")} />
        </nav>
        <div className="sidebar-footer">
          <span>API</span>
          <strong>{API_URL}</strong>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI-governed workflow intelligence engine</p>
            <h2>DAppGenius KnownCompute</h2>
          </div>
          <div className="topbar-actions">
            <a className="dashboard-link" href={DAPPGENIUS_DASHBOARD_URL}>
              ← Back to DAppGenius Dashboard
            </a>
            <StatusPill health={health} error={healthError} />
            <button className="icon-button" onClick={refreshData} disabled={refreshState.loading} title="Refresh data">
              {refreshState.loading ? <Loader2 className="spin" /> : <RefreshCcw />}
            </button>
          </div>
        </header>

        <section className={`status-banner ${highAlert ? "alert" : "normal"}`}>
          {highAlert ? <AlertTriangle /> : <CheckCircle2 />}
          <div>
            <strong>{highAlert ? "High anomaly detected" : "System Status: Normal"}</strong>
            <span>
              {highAlert
                ? `Workflow ${highAlert.workflow_id} reached ${highAlert.to_state} with score ${formatScore(highAlert.normalized_score)}.`
                : "No active high-severity workflow anomaly is currently visible."}
            </span>
          </div>
        </section>

        {view === "live" ? (
          <LiveExecution
            domain={domain}
            setDomain={setDomain}
            model={model}
            workflow={workflow}
            allowedEvents={allowedEvents}
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
            state={liveState}
            lastExecution={lastExecution}
            onGenerate={generateModel}
            onActivate={activateModel}
            onCreateWorkflow={createWorkflow}
            onRefreshEvents={() => loadAllowedEvents()}
            onExecute={executeSelectedEvent}
          />
        ) : null}
        {view === "governance" ? <Governance summary={summary} systemHealth={systemHealth} activeRecords={activeRecords} /> : null}
        {view === "history" ? <FullHistory history={history} /> : null}
        {view === "batch" ? (
          <BatchScoring
            file={csvFile}
            scores={csvScores}
            state={csvState}
            onFileChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
            onRun={runCsvScoring}
          />
        ) : null}
        {view === "admin" ? (
          <AdminControls state={adminState} response={adminResponse} onReset={runAdminReset} />
        ) : null}
        {view === "tutorials" ? <Tutorials /> : null}
      </main>
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatusPill({ health, error }: { health: HealthResponse | null; error: string }) {
  if (error) {
    return <div className="status-pill offline">Backend offline</div>;
  }
  if (!health) {
    return <div className="status-pill pending">Checking backend</div>;
  }
  return <div className="status-pill online">Backend {health.status ?? "connected"}</div>;
}

function RequestNotice({ state }: { state: RequestState }) {
  if (state.loading) {
    return (
      <div className="notice pending">
        <Loader2 className="spin" />
        <span>Working...</span>
      </div>
    );
  }
  if (state.error) return <div className="notice error">{state.error}</div>;
  if (state.success) return <div className="notice success">{state.success}</div>;
  return null;
}

function LiveExecution(props: {
  domain: string;
  setDomain: (domain: string) => void;
  model: ModelResponse | null;
  workflow: WorkflowResponse | null;
  allowedEvents: string[];
  selectedEvent: string;
  setSelectedEvent: (event: string) => void;
  state: RequestState;
  lastExecution: ExecuteResponse | null;
  onGenerate: (event: FormEvent<HTMLFormElement>) => void;
  onActivate: () => void;
  onCreateWorkflow: () => void;
  onRefreshEvents: () => void;
  onExecute: () => void;
}) {
  return (
    <section className="content-grid two">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Workflow studio</p>
            <h3>Live Execution</h3>
          </div>
          <Activity />
        </div>
        <form className="form-stack" onSubmit={props.onGenerate}>
          <label>
            Domain
            <select value={props.domain} onChange={(event) => props.setDomain(event.target.value)}>
              {DOMAINS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={props.state.loading}>
            <Play />
            Generate Model
          </button>
        </form>
        <div className="button-row">
          <button type="button" disabled={!props.model || props.state.loading} onClick={props.onActivate}>
            <CheckCircle2 />
            Activate Model
          </button>
          <button type="button" disabled={!props.model || props.state.loading} onClick={props.onCreateWorkflow}>
            <Workflow />
            Create Workflow
          </button>
        </div>
        <RequestNotice state={props.state} />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Current run</p>
            <h3>Transition Control</h3>
          </div>
          <FileClock />
        </div>
        <InfoList
          items={[
            ["Model", props.model ? `${props.model.model_id} ${props.model.version}` : "Not generated"],
            ["Workflow", props.workflow?.workflow_id ?? "Not created"],
            ["State", props.workflow?.current_state ?? "No active workflow"],
          ]}
        />
        <div className="form-stack compact">
          <label>
            Allowed event
            <select
              value={props.selectedEvent}
              onChange={(event) => props.setSelectedEvent(event.target.value)}
              disabled={!props.allowedEvents.length}
            >
              {!props.allowedEvents.length ? <option>No events available</option> : null}
              {props.allowedEvents.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
          </label>
          <div className="button-row">
            <button type="button" disabled={!props.workflow || props.state.loading} onClick={props.onRefreshEvents}>
              <RefreshCcw />
              Load Events
            </button>
            <button type="button" disabled={!props.workflow || !props.selectedEvent || props.state.loading} onClick={props.onExecute}>
              <Play />
              Execute
            </button>
          </div>
        </div>
        {props.lastExecution ? (
          <div className={`result-strip ${severityClass(props.lastExecution.severity)}`}>
            <strong>{props.lastExecution.severity}</strong>
            <span>New state: {props.lastExecution.new_state}</span>
          </div>
        ) : (
          <EmptyState text="Generate, activate, create, then execute a workflow transition." />
        )}
      </div>
    </section>
  );
}

function Governance({
  summary,
  systemHealth,
  activeRecords,
}: {
  summary: GovernanceSummary;
  systemHealth: number;
  activeRecords: HistoryRecord[];
}) {
  const domains = Object.entries(summary);
  const totals = activeRecords.reduce(
    (acc, record) => {
      acc[record.severity] += 1;
      return acc;
    },
    { HIGH: 0, MEDIUM: 0, LOW: 0 } as DomainSummary,
  );

  return (
    <section className="content-stack">
      <div className="metric-grid">
        <Metric label="System Health" value={`${systemHealth}%`} tone={systemHealth < 60 ? "danger" : systemHealth < 85 ? "warning" : "success"} />
        <Metric label="Active Records" value={String(activeRecords.length)} />
        <Metric label="High" value={String(totals.HIGH)} tone="danger" />
        <Metric label="Medium" value={String(totals.MEDIUM)} tone="warning" />
      </div>
      <div className="content-grid two">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Risk index</p>
              <h3>Governance Dashboard</h3>
            </div>
            <Gauge />
          </div>
          <div className="gauge" style={{ "--value": `${systemHealth}%` } as React.CSSProperties}>
            <span>{systemHealth}%</span>
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Severity mix</p>
              <h3>Active Transitions</h3>
            </div>
            <BarChart3 />
          </div>
          <SeverityBars summary={totals} />
        </div>
      </div>
      <div className="domain-grid">
        {domains.length ? (
          domains.map(([name, counts]) => <DomainCard key={name} name={name} counts={counts} />)
        ) : (
          <EmptyState text="No active transitions yet. Execute a workflow or score a CSV to populate governance data." />
        )}
      </div>
    </section>
  );
}

function FullHistory({ history }: { history: HistoryRecord[] }) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <section className="content-stack">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Audit ledger</p>
            <h3>Full History</h3>
          </div>
          <History />
        </div>
        {sorted.length ? (
          <DataTable records={sorted} />
        ) : (
          <EmptyState text="No audit records have been written yet." />
        )}
      </div>
      {sorted.length ? <Heatmap records={sorted} /> : null}
    </section>
  );
}

function BatchScoring({
  file,
  scores,
  state,
  onFileChange,
  onRun,
}: {
  file: File | null;
  scores: CsvScore[];
  state: RequestState;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRun: () => void;
}) {
  return (
    <section className="content-stack">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CSV anomaly scoring</p>
            <h3>Batch CSV Scoring</h3>
          </div>
          <FileSpreadsheet />
        </div>
        <div className="upload-row">
          <label className="file-picker">
            <input type="file" accept=".csv,text/csv" onChange={onFileChange} />
            <FileSpreadsheet />
            <span>{file ? file.name : "Choose CSV file"}</span>
          </label>
          <button type="button" disabled={!file || state.loading} onClick={onRun}>
            <Play />
            Run Scoring
          </button>
        </div>
        <RequestNotice state={state} />
      </div>
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Results</p>
            <h3>Scored Rows</h3>
          </div>
          <Database />
        </div>
        {scores.length ? <CsvTable scores={scores} /> : <EmptyState text="CSV scoring results will appear here." />}
      </div>
    </section>
  );
}

function AdminControls({
  state,
  response,
  onReset,
}: {
  state: RequestState;
  response: AdminResetResponse | null;
  onReset: (type: "soft" | "hard") => void;
}) {
  return (
    <section className="content-grid two">
      <div className="panel danger-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Archive mode</p>
            <h3>Soft Reset</h3>
          </div>
          <Archive />
        </div>
        <p className="muted">Marks active audit records as archived while preserving stored records.</p>
        <button type="button" disabled={state.loading} onClick={() => onReset("soft")}>
          <Archive />
          Archive Data
        </button>
      </div>
      <div className="panel danger-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Demo reset</p>
            <h3>Hard Reset</h3>
          </div>
          <Trash2 />
        </div>
        <p className="muted">Deletes demo workflow, audit, model, and ledger records from the backend database.</p>
        <button type="button" className="danger-button" disabled={state.loading} onClick={() => onReset("hard")}>
          <Trash2 />
          Delete All Data
        </button>
      </div>
      <div className="panel wide">
        <RequestNotice state={state} />
        {response ? <pre className="response">{JSON.stringify(response, null, 2)}</pre> : <EmptyState text="Admin responses will appear here." />}
      </div>
    </section>
  );
}

function Tutorials() {
  return (
    <section className="tutorial-grid">
      {tutorials.map(([title, url]) => (
        <a className="tutorial-card" key={url} href={url} target="_blank" rel="noreferrer">
          <Video />
          <span>{title}</span>
        </a>
      ))}
    </section>
  );
}

function InfoList({ items }: { items: [string, string][] }) {
  return (
    <dl className="info-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SeverityBars({ summary }: { summary: DomainSummary }) {
  const total = Math.max(1, summary.HIGH + summary.MEDIUM + summary.LOW);
  return (
    <div className="bar-stack">
      {(["HIGH", "MEDIUM", "LOW"] as Severity[]).map((severity) => (
        <div key={severity}>
          <div className="bar-label">
            <span>{severity}</span>
            <strong>{summary[severity]}</strong>
          </div>
          <div className="bar-track">
            <span className={severityClass(severity)} style={{ width: `${(summary[severity] / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DomainCard({ name, counts }: { name: string; counts: DomainSummary }) {
  const total = counts.HIGH + counts.MEDIUM + counts.LOW;
  return (
    <div className="panel">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Domain</p>
          <h3>{name}</h3>
        </div>
        <strong className="domain-total">{total}</strong>
      </div>
      <SeverityBars summary={counts} />
    </div>
  );
}

function DataTable({ records }: { records: HistoryRecord[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Workflow</th>
            <th>From</th>
            <th>To</th>
            <th>Severity</th>
            <th>Score</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={`${record.workflow_id}-${record.timestamp}-${index}`}>
              <td>{record.workflow_id}</td>
              <td>{record.from_state}</td>
              <td>{record.to_state}</td>
              <td><span className={`tag ${severityClass(record.severity)}`}>{record.severity}</span></td>
              <td>{formatScore(record.normalized_score)}</td>
              <td>{record.archived ? "Archived" : "Active"}</td>
              <td>{formatTimestamp(record.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CsvTable({ scores }: { scores: CsvScore[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Workflow</th>
            <th>State</th>
            <th>Time Delta</th>
            <th>Raw</th>
            <th>Score</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={`${score.workflow_id}-${index}`}>
              <td>{score.workflow_id}</td>
              <td>{score.state_index}</td>
              <td>{score.time_delta}</td>
              <td>{formatScore(score.raw_score)}</td>
              <td>{formatScore(score.normalized_score)}</td>
              <td><span className={`tag ${severityClass(score.severity)}`}>{score.severity}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Heatmap({ records }: { records: HistoryRecord[] }) {
  const scores = records.slice(0, 30);
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Recent score intensity</p>
          <h3>History Heatmap</h3>
        </div>
        <BarChart3 />
      </div>
      <div className="heatmap">
        {scores.map((record, index) => (
          <div
            key={`${record.workflow_id}-${record.timestamp}-${index}`}
            className={`heat-cell ${severityClass(record.severity)}`}
            style={{ opacity: Math.max(0.32, record.normalized_score || 0.18) }}
            title={`${record.workflow_id}: ${record.to_state} ${formatScore(record.normalized_score)}`}
          >
            <span>{record.to_state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Database />
      <span>{text}</span>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
