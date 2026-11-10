import React from 'react';
import { act, render } from '@testing-library/react';
import useAssetAccessSession from '../useAssetAccessSession';
import api from '../../services/api';
jest.mock('../../services/api', () => ({ __esModule: true, default: { defaults: { baseURL: 'http://test.invalid', headers: { authorization: 'Bearer test-only' } } } }));
const Probe = ({ ready }: { ready: boolean }) => { useAssetAccessSession('asset', ready); return <div>Viewer stays available</div>; };
const flush = async () => { await act(async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); }); };
let now = 0;
beforeEach(() => {
  process.env.REACT_APP_ACTIVITY_LEDGER_ENABLED = 'true'; now = 0;
  jest.useFakeTimers(); jest.spyOn(performance, 'now').mockImplementation(() => now);
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ access_session_id: 'session' }) });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); delete process.env.REACT_APP_ACTIVITY_LEDGER_ENABLED; });
const tick = async (ms: number) => { now += ms; act(() => { jest.advanceTimersByTime(ms); }); await flush(); };
test('disabled by default even after readiness', async () => {
  delete process.env.REACT_APP_ACTIVITY_LEDGER_ENABLED; render(<Probe ready />); await flush(); expect(fetch).not.toHaveBeenCalled();
});
test('no event until successful readiness; failed load remains untracked', async () => {
  const view = render(<Probe ready={false} />); await tick(15000); expect(fetch).not.toHaveBeenCalled();
  view.rerender(<Probe ready />); await flush(); expect(fetch).toHaveBeenCalledTimes(1);
  expect((fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer test-only');
});
test('hidden tab ends segment and does not heartbeat until visible again', async () => {
  render(<Probe ready />); await flush(); now = 1000;
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); }); await flush();
  await tick(15000); expect(fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body).reason).toBe('hidden');
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); }); await flush(); expect(fetch).toHaveBeenCalledTimes(3);
});
test('offline tab closes with no estimated tail', async () => {
  render(<Probe ready />); await flush();
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  act(() => { window.dispatchEvent(new Event('offline')); }); await flush();
  await tick(15000); expect(fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)).toMatchObject({ reason: 'offline', elapsed_ms: 0 });
});
test('idle stops until user interaction; sleep never bridges time', async () => {
  render(<Probe ready />); await flush();
  for (let i = 0; i < 4; i += 1) await tick(15000);
  expect(JSON.parse((fetch as jest.Mock).mock.calls.at(-1)[1].body).reason).toBe('idle');
  const count = (fetch as jest.Mock).mock.calls.length;
  await tick(15000); expect(fetch).toHaveBeenCalledTimes(count);
  act(() => { window.dispatchEvent(new Event('pointerdown')); }); await flush();
  await tick(120000);
  expect(JSON.parse((fetch as jest.Mock).mock.calls.at(-1)[1].body)).toMatchObject({ reason: 'sleep', elapsed_ms: 0 });
});
test('ambiguous transport failure retries exact request; persistent failure keeps viewer usable', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  (fetch as jest.Mock).mockRejectedValue(new Error('sensitive transport details'));
  const view = render(<Probe ready />); await flush();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect((fetch as jest.Mock).mock.calls[0][1].body).toBe((fetch as jest.Mock).mock.calls[1][1].body);
  expect(view.getByText('Viewer stays available')).toBeTruthy();
  expect(JSON.stringify(warning.mock.calls)).not.toContain('sensitive');
});
test('navigation sends authenticated keepalive close', async () => {
  const view = render(<Probe ready />); await flush(); view.unmount(); await flush();
  expect((fetch as jest.Mock).mock.calls[1][1]).toMatchObject({ keepalive: true, headers: { Authorization: api.defaults.headers.authorization } });
});
