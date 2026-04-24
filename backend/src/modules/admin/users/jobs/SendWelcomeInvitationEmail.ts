import path from 'path';
import Mail from '../../../../config/MailProvider';

interface IRequest {
  email: string;
  name: string;
  invited_by: string;
  password: string;
}

class SendWelcomeInvitationEmail {
  get key() {
    return 'WelcomeInvitationEmail';
  }

  public async execute({
    name = 'User',
    email,
    invited_by,
    password,
  }: IRequest): Promise<void> {
    const welecomeTemplate = path.resolve(
      __dirname,
      '..',
      'views',
      'welcome-invitation.hbs',
    );

    await Mail.sendMail({
      to: {
        name,
        email,
      },
      subject: '[DAppGenius] Welcome, complete your registration',
      templateData: {
        file: welecomeTemplate,
        variables: {
          name,
          invited_by,
          password,
          email,
          link: `${process.env.APP_WEB_URL}`,
        },
      },
    });
  }
}

export default new SendWelcomeInvitationEmail();
