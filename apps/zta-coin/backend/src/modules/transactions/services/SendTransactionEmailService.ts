import { injectable, inject } from 'tsyringe';
import IEmailProvider from '@shared/container/providers/MailProvider/models/IMailProvider';
import path from 'path';
import User from '@modules/users/infra/typeorm/entities/User';
import { format } from 'date-fns';

interface IRequest {
  fromUser: User;
  toUser: User;
  date: Date;
  amount: number;
  message?: string | undefined;
}

@injectable()
class SendTransactionEmailService {
  constructor(
    @inject('MailProvider')
    private mailProvider: IEmailProvider,
  ) {}

  public async execute({
    toUser,
    fromUser,
    date,
    amount,
    message,
  }: IRequest): Promise<void> {
    const transacationTemplate = path.resolve(
      __dirname,
      '..',
      'views',
      'transactions.hbs',
    );

    const formattedAmount = Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    await this.mailProvider.sendMail({
      to: {
        name: toUser.name,
        email: toUser.email,
      },
      subject: `Transaction received by ${fromUser.name}`,
      templateData: {
        file: transacationTemplate,
        variables: {
          touser_name: toUser.name.split(' ')[0],
          formuser_name: fromUser.name,
          formuser_email: fromUser.email,
          date: format(date, 'M/d/yyyy h:mm a'),
          amount: formattedAmount,
          message: message || '',
        },
      },
    });
  }
}

export default SendTransactionEmailService;
