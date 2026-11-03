/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import 'reflect-metadata';

import { container } from 'tsyringe';
import { Request } from 'express';
import SyncNodeProvider from '../implementations/SyncNodeProvider';
import { api } from '@config/api';

jest.mock('@config/nodes', () => ({
  __esModule: true,
  default: [{ name: 'NODE2', url: 'http://node-2' }],
}));
jest.mock('@config/api', () => ({
  api: jest.fn(),
}));

describe('SyncNodeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(container, 'resolve').mockReturnValue({
      execute: jest.fn().mockResolvedValue(undefined),
    } as any);
    (api as unknown as jest.Mock).mockResolvedValue({ data: 'ok' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('forwards authorization and uses the explicit request body', async () => {
    const request = {
      headers: { authorization: 'Bearer original-token' },
      body: { original: true },
    } as Request;
    const forcedBody = { synchronized: true };

    await new SyncNodeProvider().sync({
      endpoint: '/sync',
      request,
      forceRequestBody: forcedBody,
      method: 'post',
    });

    expect(api).toHaveBeenCalledWith({
      method: 'post',
      url: 'http://node-2/sync',
      data: forcedBody,
      headers: { Authorization: 'Bearer original-token' },
      timeout: 30000,
    });
  });

  test('allows an absent authorization header without allowing a missing request', async () => {
    const request = { body: { synchronized: true } } as Request;

    await expect(
      new SyncNodeProvider().sync({
        endpoint: '/sync',
        request,
        method: 'post',
      }),
    ).resolves.toBeUndefined();

    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({
        data: request.body,
        headers: {},
      }),
    );
  });
});
