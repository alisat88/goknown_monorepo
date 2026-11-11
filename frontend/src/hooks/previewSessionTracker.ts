export const HEARTBEAT_MS = 15000;
export const MAX_OBSERVATION_MS = 20000;
export const IDLE_MS = 60000;
type Transport = (path: string, body: object) => Promise<any>;

// One tracker per visible segment per tab. The server, not this clock, owns
// identity, timestamps, expiry, ordering and the final estimate.
export class PreviewSessionTracker {
  private chain: Promise<void>;
  private session?: string;
  private sequence = 0;
  private last: number;
  private pending = false;
  private stopped = false;
  private failed = false;

  constructor(
    private path: string,
    requestId: string,
    private send: Transport,
    private now: () => number,
    private onFailure: () => void
  ) {
    this.last = now();
    this.chain = this.send(path, { request_id: requestId })
      .then((event) => {
        this.session = event.access_session_id;
        // Do not count network delay before the start acknowledgement.
        this.last = now();
      })
      .catch(() => this.fail());
  }
  private fail() {
    this.failed = true;
    this.stopped = true;
    this.onFailure();
  }
  heartbeat() {
    if (this.stopped || this.pending || !this.session) return;
    const elapsed = Math.floor(this.now() - this.last);
    if (elapsed < HEARTBEAT_MS) return;
    if (elapsed > MAX_OBSERVATION_MS || elapsed < 0) {
      this.end("sleep", false);
      return;
    }
    this.pending = true;
    this.last = this.now();
    this.sequence += 1;
    const body = {
      sequence: this.sequence,
      elapsed_ms: elapsed,
      reason: "heartbeat",
    };
    this.chain = this.chain
      .then(async () => {
        await this.send(`${this.path}/${this.session}/heartbeat`, body);
      })
      .catch(() => this.fail())
      .finally(() => {
        this.pending = false;
      });
  }
  end(reason: string, countTail = true) {
    if (this.stopped) return;
    this.stopped = true;
    const elapsed = Math.floor(this.now() - this.last);
    const credit =
      this.session && countTail && elapsed >= 0 && elapsed <= MAX_OBSERVATION_MS
        ? elapsed
        : 0;
    this.chain = this.chain
      .then(async () => {
        if (this.failed || !this.session) return;
        this.sequence += 1;
        await this.send(`${this.path}/${this.session}/end`, {
          sequence: this.sequence,
          elapsed_ms: credit,
          reason,
        });
      })
      .catch(() => this.fail());
  }
  isStopped() {
    return this.stopped;
  }
}
