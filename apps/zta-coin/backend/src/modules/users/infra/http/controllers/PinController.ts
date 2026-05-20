import { api } from '@config/api';
import nodes from '@config/nodes';
import ConfirmUserService from '@modules/users/services/ConfirmUserService';
import SendNewPinEmailService from '@modules/users/services/SendNewPinEmailService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class PinController {
  public async create(request: Request, response: Response): Promise<Response> {
    try {
      const { email, pin } = request.body;

      const sendNewPinEmail = container.resolve(SendNewPinEmailService);

      const newPin = await sendNewPinEmail.execute({
        email: email.toLowerCase(),
        pin,
        masterNode: request.body.masterNode,
      });

      if (request.body.masterNode) {
        // mirror users across nodes
        nodes.map(node =>
          api.post(`${node.url}/resend-pin`, {
            ...request.body,
            pin: newPin,
          }),
        );
      }

      return response.status(204).json();
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  public async update(request: Request, response: Response): Promise<Response> {
    try {
      const { pin, email } = request.body;

      const confirmUser = container.resolve(ConfirmUserService);

      const user = await confirmUser.execute({
        pin,
        email: email.toLowerCase(),
      });

      if (request.body.masterNode) {
        // mirror users across nodes
        nodes.map(node =>
          api.put(`${node.url}/confirm-email`, {
            pin,
            email,
            masterNode: request.body.masterNode,
          }),
        );
      }

      return response.json(classToClass(user));
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }
}
