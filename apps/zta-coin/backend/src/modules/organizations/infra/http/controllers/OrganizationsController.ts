import { api } from '@config/api';
import nodes from '@config/nodes';
import CreateOrganizationService from '@modules/organizations/services/CreateOrganizationService';
import FindOrganizationService from '@modules/organizations/services/FindOrganizationService';
import ListAllOrganizationsService from '@modules/organizations/services/ListAllOrganizationsService';
import UpdateOrganizationService from '@modules/organizations/services/UpdateOrganizationService';
import CreateCurrencyService from '@modules/transactions/services/CreateCurrencyService';
import UpdateCurrencyService from '@modules/transactions/services/UpdateCurrencyService';
import { AxiosError } from 'axios';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class OrganizationsController {
  // the controllers on the request layer (http) and direct to the services
  // execute the logic and business rules
  // the route show act like a GET only displaying one record
  public async show(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    // id from request /organizations/{id}
    const { id } = request.params;

    // container.resolve creates the class FindOrganizationService
    // this class is responsible to search a organization
    const findOrganization = container.resolve(FindOrganizationService);
    // execute the search of the organization with the OrganizationID {id} and the user id {user_syncid}
    // the user id is used to validate if the user belongs to the organization
    const organization = await findOrganization.execute(id, user_syncid);

    return response.json(classToClass(organization));
  }

  // follows the same action as the show() method but returns all the organizations
  public async index(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;

    const listAllOrganizations = container.resolve(ListAllOrganizationsService);
    const organizations = await listAllOrganizations.execute(user_syncid);

    return response.json(classToClass(organizations));
  }

  // create organization
  public async create(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    // always using the sync_id because it is the unique id for all nodes
    const user_syncid = request.user.sync_id;
    // variables to create a organization
    const { admin_alias, name, admins_syncid, sync_id, enable_wallet } =
      request.body;

    const createOrganization = container.resolve(CreateOrganizationService);
    const organization = await createOrganization.execute({
      user_syncid,
      admin_alias,
      name,
      sync_id,
      enableWallet: enable_wallet,
      admins_syncid,
    });

    // create a unique currency id for the organization
    const createCurrency = container.resolve(CreateCurrencyService);
    await createCurrency.execute({
      organization_id: organization.id,
      enableWallet: enable_wallet,
    });
    // console.log({ ...request.body });
    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api
          .post(
            `${node.url}/organizations`,
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

    return response.json(organization);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    // authenticated user id lookup
    const user_syncid = request.user.sync_id;
    const { name, admin_alias, enable_wallet } = request.body;
    const { id } = request.params;

    const updateOrganization = container.resolve(UpdateOrganizationService);
    const organization = await updateOrganization.execute({
      sync_id: id,
      user_syncid,
      admin_alias,
      name,
      enableWallet: enable_wallet,
    });

    // activate or deactivate the currency service
    const updateCurrency = container.resolve(UpdateCurrencyService);
    await updateCurrency.execute({
      enableWallet: enable_wallet,
      organization_id: organization.id,
    });

    // sync node
    if (request.body.masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.put(
          `${node.url}/organizations/${id}`,
          { ...request.body },
          {
            headers: {
              Authorization: request.headers.authorization,
              // pre_authenticated: request.headers.pre_authenticated,
            },
          },
        ),
      );
    }

    return response.json(organization);
  }
}
