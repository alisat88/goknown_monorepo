import { container } from 'tsyringe';
import { ISyncNodeDTO } from '../dtos/ISyncNodeDTO';
import ISyncNodeProvider from '../models/ISyncNodeProvider';
import UpdateAuditLogNodeResponseService from '@modules/auditlogs/services/UpdateAuditLogNodeResponseService';
import nodes from '@config/nodes';
import { api } from '@config/api';

// axios
// .post(
//   `${node.url}${endpoint}`,
//   { ...request.body },
//   {
//     headers: {
//       Authorization: request.headers.authorization,
//       // pre_authenticated: request.headers.pre_authenticated,
//     },
//   },
// )

class SyncNodeProvider implements ISyncNodeProvider {
  public async sync({
    request,
    dapp_token_sync_id = '',
    endpoint,
    method,
    dapp,
  }: ISyncNodeDTO): Promise<void> {
    const updateAuditLogNodeResponse = container.resolve(
      UpdateAuditLogNodeResponseService,
    );
    let headers = {};
    if (request.headers.authorization) {
      headers = {
        Authorization: request.headers.authorization,
      };
    }

    for (const node of nodes) {
      try {
        // const masterNode = false;
        const response = await api({
          method,
          url: `${node.url}${endpoint}`,
          // data: { ...request.body, masterNode },
          data: request.body,
          headers,
          timeout: 30000,
        });
        // console.log('response =>', response);
        if (dapp_token_sync_id) {
          await updateAuditLogNodeResponse.execute({
            dapp_token_sync_id,
            outcome: 'success',
            node: node.name,
            message: response.data,
            dapp,
          });
        }
      } catch (error: any) {
        // const errorResponse = error.response.data || error.response;
        console.log(error);
        if (dapp_token_sync_id) {
          await updateAuditLogNodeResponse.execute({
            dapp_token_sync_id,
            outcome: 'error',
            node: node.name,
            message: {
              error,
              responseData: error.response.data || error.response,
            },
            dapp,
          });
        }
      }
    }

    //   nodes.map(node =>
    //     axios({
    //       method,
    //       url: `${node.url}${endpoint}`,
    //       data: request.body,
    //       headers: {
    //         Authorization: request.headers.authorization,
    //       },
    //     })
    //       .then(response =>
    //         updateAuditLogNodeResponse.execute({
    //           dapp_token_sync_id,
    //           outcome: 'success',
    //           node: node.name,
    //           message: response.data,
    //         }),
    //       )
    //       .catch((error: AxiosError) => {
    //         // console.log(error);
    //         console.log(error.response);
    //         updateAuditLogNodeResponse.execute({
    //           dapp_token_sync_id,
    //           outcome: 'error',
    //           node: node.name,
    //           message: error.response,
    //         });
    //       }),
    //   );
  }
}

export default SyncNodeProvider;
