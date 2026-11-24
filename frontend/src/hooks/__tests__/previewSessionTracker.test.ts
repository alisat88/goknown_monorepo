import { PreviewSessionTracker } from '../previewSessionTracker';
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
let now: number;
let send: jest.Mock;
let fail: jest.Mock;
beforeEach(() => { now = 0; send = jest.fn().mockResolvedValue({ access_session_id: 'session' }); fail = jest.fn(); });
const tracker = () => new PreviewSessionTracker('/preview', 'request-id', send, () => now, fail);
test('start then heartbeat then end are ordered', async () => {
  const t = tracker(); await flush(); now = 15000; t.heartbeat(); await flush();
  now = 17000; t.end('navigation'); await flush();
  expect(send.mock.calls.map(call => call[1])).toEqual([
    { request_id: 'request-id' }, { sequence: 1, elapsed_ms: 15000, reason: 'heartbeat' },
    { sequence: 2, elapsed_ms: 2000, reason: 'navigation' },
  ]);
});
test('duplicate end and heartbeats after close do nothing', async () => {
  const t = tracker(); await flush(); t.end('hidden'); t.end('pagehide'); now = 16000; t.heartbeat(); await flush();
  expect(send).toHaveBeenCalledTimes(2);
});
test('sleep ends incomplete with zero credit', async () => {
  const t = tracker(); await flush(); now = 120000; t.heartbeat(); await flush();
  expect(send.mock.calls[1][1]).toEqual({ sequence: 1, elapsed_ms: 0, reason: 'sleep' });
});
test('offline does not credit missing tail', async () => {
  const t = tracker(); await flush(); now = 4000; t.end('offline', false); await flush();
  expect(send.mock.calls[1][1].elapsed_ms).toBe(0);
});
test('start failure never fabricates a close', async () => {
  send.mockRejectedValue(new Error('unavailable')); const t = tracker(); await flush(); t.end('navigation'); await flush();
  expect(fail).toHaveBeenCalled(); expect(send).toHaveBeenCalledTimes(1);
});
test('close before start acknowledgement still closes the eventual session', async () => {
  let resolve: any; send.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  const t = tracker(); t.end('navigation'); resolve({ access_session_id: 'session' }); await flush();
  expect(send.mock.calls[1][0]).toBe('/preview/session/end');
});
test('two tabs retain independent sessions/sequences', async () => {
  const a = tracker(), b = tracker(); await flush(); now = 15000; a.heartbeat(); b.heartbeat(); await flush();
  expect(send.mock.calls.slice(2).map(call => call[1].sequence)).toEqual([1,1]);
});
