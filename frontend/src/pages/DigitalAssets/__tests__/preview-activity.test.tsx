import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import Preview from '../preview';
import api from '../../../services/api';
import useAssetAccessSession from '../../../hooks/useAssetAccessSession';
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../../hooks/useAssetAccessSession', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../hooks/auth', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
const mockToast = jest.fn();
jest.mock('../../../hooks/toast', () => ({ useToast: () => ({ addToast: mockToast }) }));
jest.mock('../../../components/Asset', () => (props: any) => <div><button onClick={props.onReady}>viewer loaded</button><button onClick={props.onViewerError}>viewer failed</button></div>);
const asset = { id: 'db-asset', sync_id: 'asset', asset_url: '/test', mimetype: 'image/png', name: 'Example',
  privacy: 'private', user_id: 'owner', created_at: '2026-01-01T00:00:00.000Z', media_processing_status: 'queued' };
const page = () => render(<MemoryRouter initialEntries={['/digitalassets/asset/preview']}><Route path='/digitalassets/:id/preview'><Preview /></Route></MemoryRouter>);
beforeEach(() => { jest.clearAllMocks(); (api.get as jest.Mock).mockResolvedValue({ data: asset }); });
test('metadata and repeated conversion polling do not start sessions; only readiness does', async () => {
  jest.useFakeTimers();
  const view = page();
  await act(async () => { await Promise.resolve(); });
  await act(async () => { jest.advanceTimersByTime(2000); await Promise.resolve(); });
  expect(api.get).toHaveBeenCalledTimes(3);
  expect((useAssetAccessSession as jest.Mock).mock.calls.every(call => !call[1])).toBe(true);
  fireEvent.click(view.getByText('viewer loaded'));
  expect(useAssetAccessSession).toHaveBeenLastCalledWith('asset', true);
  fireEvent.click(view.getByText('viewer failed'));
  expect(useAssetAccessSession).toHaveBeenLastCalledWith('asset', false);
  view.unmount();
  jest.useRealTimers();
});
test('failed metadata request cannot create a ready preview', async () => {
  (api.get as jest.Mock).mockRejectedValue(new Error('failed'));
  const view = page(); await waitFor(() => expect(mockToast).toHaveBeenCalled());
  fireEvent.click(view.getByText('viewer loaded'));
  expect((useAssetAccessSession as jest.Mock).mock.calls.every(call => !call[1])).toBe(true);
});
