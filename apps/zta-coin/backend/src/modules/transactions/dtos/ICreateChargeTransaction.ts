import {
  EnumCategory,
  EnumTransactionType,
  EnumStatus,
} from '../infra/typeorm/entities/Transaction';

export default interface ICreateChargeTransactionDTO {
  category: EnumCategory.Charge;
  transactionType: EnumTransactionType.Received;
  balance: number;
  amount: number;
  to_user_id: string;
  charge_id: string;
  sync_id?: string;
  status: EnumStatus;
  organization_id?: string | null;
}
