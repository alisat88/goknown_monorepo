import AppError from '@shared/errors/AppError';
import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';
import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable, container } from 'tsyringe';
import BuildConsensusPayloadHashService from './BuildConsensusPayloadHashService';
import IConsensusPayloadDTO from '../dtos/IConsensusPayloadDTO';

interface IRequest {
  payload: IConsensusPayloadDTO;
  payloadHash: string;
}

interface IResponse {
  approved: boolean;
  reason?: string;
}

@injectable()
class ValidateConsensusProposalService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  public async execute({ payload, payloadHash }: IRequest): Promise<IResponse> {
    try {
      const buildHash = container.resolve(BuildConsensusPayloadHashService);
      const expectedPayloadHash = buildHash.execute(payload);

      if (expectedPayloadHash !== payloadHash) {
        throw new AppError('Consensus payload hash mismatch.');
      }

      if (
        !payload.proposalId ||
        !payload.transactionSyncId ||
        !payload.fromUserId ||
        !payload.toUserId
      ) {
        throw new AppError('Consensus payload is missing required fields.');
      }

      if (payload.fromUserId === payload.toUserId) {
        throw new AppError('You cannot send to yourself');
      }

      if (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) < 1) {
        throw new AppError('You can only send a minimum of 1 token');
      }

      const toUser = await this.usersRepository.findBySyncId(payload.toUserId);
      if (!toUser) {
        throw new AppError(
          'The user you are trying to send tokens does not exist',
        );
      }

      const fromUser = await this.usersRepository.findBySyncId(
        payload.fromUserId,
      );
      if (!fromUser) {
        throw new AppError(
          'We were unable to load your information, please try again later',
        );
      }

      let organizationId = null;
      if (payload.organizationId) {
        const organization = await this.organizationsRepository.findBySyncId(
          payload.organizationId,
        );
        if (!organization) {
          throw new AppError('Organization not found');
        }
        organizationId = organization.id;
      }

      const fromUserCurrentBalance =
        await this.transactionsRepository.findBalance(fromUser.id, organizationId);

      if (Number(fromUserCurrentBalance) < Number(payload.amount)) {
        throw new AppError(
          "You don't have enough balance to complete this transaction",
        );
      }

      return { approved: true };
    } catch (error: any) {
      return {
        approved: false,
        reason: error.message || 'Consensus proposal rejected.',
      };
    }
  }
}

export default ValidateConsensusProposalService;
