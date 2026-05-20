import { Request } from 'express';

export type ISyncNodeDTO = {
  endpoint: string;
  request: Request;
  method: 'post' | 'put';
  dapp_token_sync_id?: string;
  forceRequestBody?: any;
  dapp?: string;
};
