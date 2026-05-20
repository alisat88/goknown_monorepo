import { injectable, inject } from 'tsyringe';
import IEmailProvider from '@shared/container/providers/MailProvider/models/IMailProvider';
import path from 'path';
import AppError from '@shared/errors/AppError';

interface IRequest {
  email: string;
  name: string;
  pin: string;
}

@injectable()
class SendWelcomeEmailService {
  static key: any;
  static id: any;
  constructor(
    @inject('MailProvider')
    private mailProvider: IEmailProvider,
  ) { }

  public async execute({ name, email, pin }: IRequest): Promise<void> {
    const canSendEmail = process.env.MAIL_BYPASS !== 'true';

    if (!canSendEmail) {
      throw new AppError('Email settings are not enabled.');
    }

    const welecomeTemplate = path.resolve(
      __dirname,
      '..',
      'views',
      'welcome.hbs',
    );

    await this.mailProvider.sendMail({
      to: {
        name,
        email,
      },
      subject: '[DAppGenius] Welcome, complete your registration',
      templateData: {
        file: welecomeTemplate,
        variables: {
          name: name.split(' ')[0],
          pin,
          link: `${process.env.APP_WEB_URL}/confirm-email-denied?email=${email}&pin=${pin}`,
        },
      },
    });
  }
}

export default SendWelcomeEmailService;
