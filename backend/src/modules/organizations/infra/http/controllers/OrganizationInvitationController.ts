import { api } from '@config/api';
import nodes from '@config/nodes';
import AcceptOrganizationInvitationService from '@modules/organizations/services/AcceptOrganizationInvitationService';
import DeclineOrganizationInvitationService from '@modules/organizations/services/DeclineOrganizationInvitationService';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class OrganizationInvitationController {
  public async update(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    const { id: organization_syncid } = request.params;

    const acceptInvitation = container.resolve(
      AcceptOrganizationInvitationService,
    );

    await acceptInvitation.execute({ user_syncid, organization_syncid });

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .put(
            `${node.url}/organizations/${organization_syncid}/accept-invite`,
            { ...request.body },
            {
              headers: {
                Authorization: request.headers.authorization,
                // pre_authenticated: request.headers.pre_authenticated,
              },
            },
          )
          .catch((err: AxiosError) =>
            console.log(err.response ? err.response.data : err.message),
          ),
      );
    }

    return response.send();
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    const { id: organization_syncid } = request.params;

    const declineInvitation = container.resolve(
      DeclineOrganizationInvitationService,
    );
    await declineInvitation.execute({ user_syncid, organization_syncid });

    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .put(
            `${node.url}/organizations/${organization_syncid}/decline-invite`,
            { ...request.body },
            {
              headers: {
                Authorization: request.headers.authorization,
                // pre_authenticated: request.headers.pre_authenticated,
              },
            },
          )
          .catch((err: AxiosError) =>
            console.log(err.response ? err.response.data : err.message),
          ),
      );
    }

    return response.send();
  }
}

export default OrganizationInvitationController;
