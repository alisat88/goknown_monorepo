interface IRequest {
  from_user: string;
  to_user: string;
  amount: number;
}

class TransferTokenService {
  private balances: Record<string, number> = {};

  public async execute({
    from_user,
    to_user,
    amount,
  }: IRequest): Promise<any> {

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!this.balances[from_user]) this.balances[from_user] = 1000;
    if (!this.balances[to_user]) this.balances[to_user] = 0;

    if (this.balances[from_user] < amount) {
      throw new Error('Insufficient balance');
    }

    this.balances[from_user] -= amount;
    this.balances[to_user] += amount;

    return {
      from_user,
      to_user,
      amount,
      from_balance: this.balances[from_user],
      to_balance: this.balances[to_user],
      status: 'Completed',
      timestamp: new Date(),
    };
  }
}

export default TransferTokenService;