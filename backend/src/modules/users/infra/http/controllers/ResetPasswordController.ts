import { Request, Response } from 'express';

import { container } from 'tsyringe';

import ResetPasswordService from '@modules/users/services/ResetPasswordService';
import nodes from '@config/nodes';
import { api } from '@config/api';

export default class ResettPasswordController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { password, token, masterNode } = request.body;

    const resetPasswordService = container.resolve(ResetPasswordService);

    await resetPasswordService.execute({ password, token });

    if (masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.post(`${node.url}/reset`, {
          password,
          token,
          masterNode,
        }),
      );
    }

    return response.status(204).json();
  }
}
