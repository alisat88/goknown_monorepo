import { accountService } from '../../../shared/accounts/AccountService';
import { ledgerService } from '../../../shared/ledger/LedgerService';
import { hashService } from '../../../shared/hash/HashService';
import { getConnection, EntityManager } from 'typeorm';
import {
  normalizeTokenAmount,
  tokenAmountToNumber,
} from '../../../shared/amounts/TokenAmount';

interface IRequest {
  user_id: string;
  to_user?: string;
  amount: number;
}

interface ILedgerRecord {
  type: string;
  timestamp: string;
  transactionId: string;
  issuer: string;
  recipient: string;
  before: number;
  minted: number;
  after: number;
}

class MintTokenService {
  private readonly ISSUER_ACCOUNT = "KN_ISSUER";
  private readonly SYSTEM_ACCOUNT = "KNOWN_SYSTEM";

  constructor(
    private readonly recordLedger: (
      record: any,
      manager: EntityManager,
    ) => Promise<void> = (record, manager) =>
      ledgerService.record(record, manager),
  ) {}

  public async execute({
    user_id,
    to_user,
    amount,
  }: IRequest): Promise<ILedgerRecord> {
    // 🔒 Enforce issuer-only minting
    if (user_id !== this.ISSUER_ACCOUNT) {
      throw new Error("Only KN Issuer Account can mint tokens");
    }

    let destinationAccount = this.SYSTEM_ACCOUNT;

    if (to_user !== undefined) {
      if (typeof to_user !== "string" || !to_user.trim()) {
        throw new Error("A valid destination account is required");
      }

      destinationAccount = to_user.trim();
    }

    const normalizedAmount = normalizeTokenAmount(amount);
    const apiAmount = tokenAmountToNumber(normalizedAmount);

    return getConnection().transaction(async manager => {
      const preBalanceDecimal = await accountService.getBalanceDecimal(
        destinationAccount,
        manager,
      );
      await accountService.credit(destinationAccount, normalizedAmount, manager);
      const postBalanceDecimal = await accountService.getBalanceDecimal(
        destinationAccount,
        manager,
      );

      const preBalance = tokenAmountToNumber(preBalanceDecimal);
      const postBalance = tokenAmountToNumber(postBalanceDecimal);
      const timestamp = new Date().toISOString();
      const transactionType = "KN-MNT-000";
      const transactionPayload = {
        type: transactionType,
        timestamp,
        issuer: user_id,
        to: destinationAccount,
        amount: apiAmount,
        before: { balance: preBalance },
        after: { balance: postBalance },
      };
      const transactionId = hashService.hash(transactionPayload);
      const record: ILedgerRecord = {
        type: transactionType,
        timestamp,
        transactionId,
        issuer: user_id,
        recipient: destinationAccount,
        before: preBalance,
        minted: apiAmount,
        after: postBalance,
      };

      await this.recordLedger(
        {
          id: transactionId,
          type: transactionType,
          timestamp,
          from: user_id,
          to: destinationAccount,
          amount: normalizedAmount,
          before: { balance: preBalance },
          after: { balance: postBalance },
        },
        manager,
      );

      return record;
    });
  }
}

export default MintTokenService;
