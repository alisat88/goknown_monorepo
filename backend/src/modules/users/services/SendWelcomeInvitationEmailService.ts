import { injectable, inject } from 'tsyringe';
import IEmailProvider from '@shared/container/providers/MailProvider/models/IMailProvider';
import path from 'path';
import AppError from '@shared/errors/AppError';

interface IRequest {
  email: string;
  name: string;
  invited_by: string;
  setup_link: string;
}

@injectable()
class SendWelcomeInvitationEmailService {
  constructor(
    @inject('MailProvider')
    private mailProvider: IEmailProvider,
  ) {}

  public get key(): string {
    return 'WelcomeInvitationEmail';
  }

  public async execute({
    name,
    email,
    invited_by,
    setup_link,
  }: IRequest): Promise<void> {
    const welecomeTemplate = path.resolve(
      __dirname,
      '..',
      'views',
      'welcome-invitation.hbs',
    );

    const canSendEmail = process.env.MAIL_BYPASS !== 'true';

    if (!canSendEmail) {
      throw new AppError('Email settings are not enabled.');
    }

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
          invited_by,
          email,
          link: setup_link,
        },
      },
    });
  }
}

export default SendWelcomeInvitationEmailService;
