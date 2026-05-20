import { accountService } from '../../../shared/accounts/AccountService';
import { ledgerService } from '../../../shared/ledger/LedgerService';
import { hashService } from '../../../shared/hash/HashService';

interface IRequest {
  user_id: string;
  amount: number;
}

interface ILedgerRecord {
  type: string;
  timestamp: string;
  transactionId: string;
  issuer: string;
  before: number;
  minted: number;
  after: number;
}

class MintTokenService {
  private readonly ISSUER_ACCOUNT = "KN_ISSUER";
  private readonly SYSTEM_ACCOUNT = "KNOWN_SYSTEM";

  public async execute({ user_id, amount }: IRequest): Promise<ILedgerRecord> {

    // 🔒 Enforce issuer-only minting
    if (user_id !== this.ISSUER_ACCOUNT) {
      throw new Error("Only KN Issuer Account can mint tokens");
    }

    if (amount <= 0) {
      throw new Error("Mint amount must be greater than 0");
    }

    // 📊 Before state
    const preBalance = accountService.getBalance(this.SYSTEM_ACCOUNT);

    // 💰 Mint tokens → SYSTEM account
    accountService.credit(this.SYSTEM_ACCOUNT, amount);

    // 📊 After state
    const postBalance = accountService.getBalance(this.SYSTEM_ACCOUNT);

    // ⏱ Timestamp (UTC)
    const timestamp = new Date().toISOString();

    // 🏷 Transaction Type
    const transactionType = "KN-MNT-000";

    // 🔐 Build canonical payload
    const transactionPayload = {
      type: transactionType,
      timestamp,
      issuer: user_id,
      to: this.SYSTEM_ACCOUNT,
      amount,
      before: {
        balance: preBalance,
      },
      after: {
        balance: postBalance,
      },
    };

    // 🔑 Generate deterministic hash
    const transactionId = hashService.hash(transactionPayload);

    // 📒 Ledger record (returned to client)
    const record: ILedgerRecord = {
      type: transactionType,
      timestamp,
      transactionId,
      issuer: user_id,
      before: preBalance,
      minted: amount,
      after: postBalance,
    };

    // 📌 Store in GLOBAL ledger
    ledgerService.record({
      id: transactionId,
      type: transactionType,
      timestamp,
      to: this.SYSTEM_ACCOUNT,
      amount,
      before: { balance: preBalance },
      after: { balance: postBalance },
    });

    return record;
  }
}

export default MintTokenService;