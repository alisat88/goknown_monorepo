import {
  EnumCategory,
  EnumTransactionType,
  EnumStatus,
} from '../infra/typeorm/entities/Transaction';

export default interface ICreateTransactionDTO {
  category: EnumCategory.Transaction;
  transactionType: EnumTransactionType;
  balance: number;
  amount: number;
  to_user_id: string;
  sync_id?: string;
  from_user_id: string;
  message?: string;
  organization_id?: string | null;
  status: EnumStatus;
}
