import 'reflect-metadata';

import { container } from 'tsyringe';
import { Request, Response } from 'express';
import UploadDigitalAssetsController from '../infra/http/controller/UploadDigitalAssetsController';
import CreateDigitalAssetsService from '../services/CreateDigitalAssetsService';
import SyncNodeProvider from '@shared/container/providers/SyncNodeProvider/implementations/SyncNodeProvider';

describe('UploadDigitalAssetsController synchronization', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('uses the original request and sends generated file data to withoutfile', async () => {
    const digitalAsset = {
      filename: 'stored-name.pdf',
      mimetype: 'application/pdf',
      token: 'file-token',
    };
    const createDigitalAsset = {
      execute: jest.fn().mockResolvedValue(digitalAsset),
    };
    const syncNodeProvider = {
      sync: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(container, 'resolve').mockImplementation(token => {
      if (token === CreateDigitalAssetsService)
        return createDigitalAsset as any;
      if (token === SyncNodeProvider) return syncNodeProvider as any;
      throw new Error('Unexpected container dependency');
    });

    const request = Object.assign(
      Object.create({
        headers: { authorization: 'Bearer original-token' },
      }),
      {
        user: { sync_id: 'user-sync-id' },
        file: { filename: 'uploaded-name.pdf' },
        body: {
          name: 'Asset name',
          description: 'Asset description',
          folder_sync_id: 'folder-sync-id',
          privacy: 'private',
          sync_id: 'asset-sync-id',
          masterNode: true,
          room_syncid: 'room-sync-id',
        },
      },
    ) as Request;
    const response = {
      json: jest.fn().mockReturnValue('response'),
    } as unknown as Response;

    const result = await new UploadDigitalAssetsController().create(
      request,
      response,
    );

    expect(syncNodeProvider.sync).toHaveBeenCalledWith({
      dapp_token_sync_id: 'asset-sync-id',
      endpoint: '/me/digitalassets/withoutfile',
      request,
      forceRequestBody: {
        ...request.body,
        filename: digitalAsset.filename,
        mimetype: digitalAsset.mimetype,
        filetoken: digitalAsset.token,
      },
      method: 'post',
    });
    expect(request.headers.authorization).toBe('Bearer original-token');
    expect(response.json).toHaveBeenCalledWith(digitalAsset);
    expect(result).toBe('response');
  });
});
