/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
  failedMessages?: Array<string | undefined>;
}

@injectable()
class SendRejectorFailTransactionEmailService {
  constructor(
    @inject('MailProvider')
    private mailProvider: IEmailProvider,
  ) {}

  public async execute({
    fromUser,
    toUser,
    date,
    amount,
    failedMessages,
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
        name: fromUser.name,
        email: fromUser.email,
      },
      subject: `Transaction rejected`,
      templateData: {
        file: transacationTemplate,
        variables: {
          touser_name: toUser.name.split(' ')[0],
          formuser_name: fromUser.name,
          formuser_email: fromUser.email,
          date: format(date, 'M/d/yyyy h:mm a'),
          amount: formattedAmount,
          message: failedMessages ? failedMessages.join(',') : '',
        },
      },
    });
  }
}

export default SendRejectorFailTransactionEmailService;
