import React, { FormEvent, useCallback, useEffect, useState } from "react";

import ButtonBack from "../../components/ButtonBack";
import { useAuth } from "../../hooks/auth";
import api from "../../services/api";
import { Container, Filters, Footer, Header, Table } from "./styles";

type ActivityEvent = {
  user_id: string;
  asset_id: string;
  event_type: string;
  recorded_at: string;
  estimated_active_ms: number | null;
  outcome: string | null;
};

const PAGE_SIZE = 50;

function formatDuration(milliseconds: number | null): string {
  if (milliseconds == null) return "—";
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining
    ? `${minutes}m ${remaining}s`
    : `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

const ActivityLog: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [access, setAccess] = useState<
    "loading" | "allowed" | "denied" | "error"
  >("loading");

  const load = useCallback(
    async (nextOffset = 0) => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/admin/activity-log", {
          params: {
            from: from ? `${from}T00:00:00.000Z` : undefined,
            to: to ? `${to}T23:59:59.999Z` : undefined,
            user: userFilter || undefined,
            asset: assetFilter || undefined,
            limit: PAGE_SIZE,
            offset: nextOffset,
          },
        });
        setEvents(response.data.events);
        setTotal(response.data.page.total);
        setOffset(nextOffset);
      } catch (requestError: any) {
        if (requestError?.response?.status === 403) {
          setAccess("denied");
          setEvents([]);
          setTotal(0);
          setError("");
          return;
        }
        setError(
          requestError?.response?.data?.message ||
            "Unable to load activity log."
        );
      } finally {
        setLoading(false);
      }
    },
    [assetFilter, from, to, userFilter]
  );

  useEffect(() => {
    let active = true;
    setAccess("loading");
    setError("");
    if (user.role === "admin") {
      setAccess("allowed");
      load(0);
      return () => {
        active = false;
      };
    }
    api
      .get("/admin/activity-log/access")
      .then(() => {
        if (active) {
          setAccess("allowed");
          load(0);
        }
      })
      .catch((requestError: any) => {
        if (!active) return;
        setAccess(requestError?.response?.status === 403 ? "denied" : "error");
      });
    return () => {
      active = false;
    };
    // The initial request must use the current filters without refetching on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role]);

  if (access === "loading") {
    return (
      <Container>
        <h1>Activity Log</h1>
        <p>Checking Activity Log access…</p>
      </Container>
    );
  }

  if (access === "denied") {
    return (
      <Container>
        <h1>Activity Log</h1>
        <p>Access denied.</p>
      </Container>
    );
  }

  if (access === "error") {
    return (
      <Container>
        <h1>Activity Log</h1>
        <p role="alert">Unable to verify Activity Log access.</p>
      </Container>
    );
  }

  /* Access is granted by the server; ordinary users never reach the log query. */
  if (access !== "allowed") return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    load(0);
  };

  return (
    <Container>
      <Header>
        <ButtonBack
          title="Activity Log"
          mobileTitle="Activity Log"
          goTo="/dashboard"
        />
        <h1>Activity Log</h1>
      </Header>
      <Filters onSubmit={submit}>
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <label>
          User
          <input
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            placeholder="User ID"
          />
        </label>
        <label>
          Asset
          <input
            value={assetFilter}
            onChange={(event) => setAssetFilter(event.target.value)}
            placeholder="Asset ID"
          />
        </label>
        <button type="submit">Apply filters</button>
      </Filters>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p>Loading activity…</p>
      ) : events.length === 0 ? (
        <p>No activity records found.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>User</th>
              <th>Asset</th>
              <th>Event</th>
              <th>Timestamp</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {events.map((item, index) => (
              <tr key={`${item.recorded_at}-${item.user_id}-${index}`}>
                <td>{item.user_id}</td>
                <td>{item.asset_id}</td>
                <td>{item.event_type}</td>
                <td>{new Date(item.recorded_at).toLocaleString()}</td>
                <td>{formatDuration(item.estimated_active_ms)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Footer>
        <span>
          {total === 0
            ? "0 records"
            : `${offset + 1}–${Math.min(
                offset + events.length,
                total
              )} of ${total}`}
        </span>
        <span>
          <button
            type="button"
            disabled={offset === 0 || loading}
            onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
          >
            Previous
          </button>{" "}
          <button
            type="button"
            disabled={loading || offset + PAGE_SIZE >= total}
            onClick={() => load(offset + PAGE_SIZE)}
          >
            Next
          </button>
        </span>
      </Footer>
    </Container>
  );
};

export default ActivityLog;
