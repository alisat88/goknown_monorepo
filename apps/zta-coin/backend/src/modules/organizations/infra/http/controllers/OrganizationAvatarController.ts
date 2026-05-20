import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { classToClass } from 'class-transformer';

import UpdateOrganizationAvatarService from '@modules/organizations/services/UpdateOrganizationAvatarService';

export default class OrganizationAvatarController {
  public async update(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id } = request.params;
    const { masterNode } = request.body;
    const UpdateOrganizationAvatar = container.resolve(
      UpdateOrganizationAvatarService,
    );

    const organization = await UpdateOrganizationAvatar.execute({
      user_syncid: user_syncid,
      sync_id: id,
      avatarFilename: request.file.filename,
      master_node: masterNode,
    });

    return response.json(classToClass(organization));
  }
}
