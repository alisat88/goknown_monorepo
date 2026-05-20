//

import nodes from '@config/nodes';
import CreateUserService from '@modules/users/services/CreateUserService';
import { container, injectable } from 'tsyringe';
import { v4 as uuid, v5 as uuidv5 } from 'uuid';
import pLimit from 'p-limit'; // Limit concurrency
import { api } from '@config/api';

type IRequest = {
  quantity: number;
};

@injectable()
class CreateUserLaboratoryService {
  public async execute({ quantity }: IRequest): Promise<any> {
    // Limit the number of promises running simultaneously
    const limit = pLimit(25); // Adjust this value as needed (based on tests and infrastructure)

    const promises = [];

    const createUser = container.resolve(CreateUserService);

    for (let i = 0; i < quantity; i++) {
      promises.push(
        limit(async () => {
          const body = {
            name: `User${i}`,
            email: `user${uuid()}@example.com`,
            password: `password${i}`,
            ignoreWelcomeEmail: true,
            masterNode: true,
            pin: '',
          };

          const id = `${body.email}_${new Date().getTime()}`;
          const sync_id = uuidv5(id || '', process.env.NODE_UUID || '');

          const user = await createUser.execute({
            name: body.name,
            email: body.email,
            password: body.password,
            sync_id,
            pin: body.pin,
          });

          console.log('User created:', user.email);

          // Cria usuários nos nodes em paralelo
          await Promise.all(
            nodes.map(node =>
              api.post(`${node.url}/users`, {
                ...body,
                sync_id,
                pin: user.pin,
              }),
            ),
          );
        }),
      );
    }

    // Aguarda que todas as promessas sejam resolvidas
    await Promise.all(promises);
  }
}

export default CreateUserLaboratoryService;
