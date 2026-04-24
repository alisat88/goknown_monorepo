import { Response, Request } from 'express';
import { container } from 'tsyringe';
import { classToClass } from 'class-transformer';

import UpdateProfileService from '@modules/users/services/UpdateProfileService';
import ShowProfileService from '@modules/users/services/ShowProfileService';
import nodes from '@config/nodes';
import { api } from '@config/api';

export default class ProfileController {
  public async show(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.sync_id;
    const showProfile = container.resolve(ShowProfileService);

    const user = await showProfile.execute({ user_id });

    return response.json(classToClass(user));
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.sync_id;
    const { name, old_password, password, phone } = request.body;

    const updateProfile = container.resolve(UpdateProfileService);

    const user = await updateProfile.execute({
      user_id,
      name,
      old_password,
      password,
      phone,
    });

    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.put(
          `${node.url}/profile`,
          { ...request.body, masterNode: true },
          {
            headers: {
              Authorization: request.headers.authorization,
              // pre_authenticated: request.headers.pre_authenticated,
            },
          },
        ),
      );
    }

    return response.json(classToClass(user));
  }
}
