import { injectable, inject } from 'tsyringe';
import IEmailProvider from '@shared/container/providers/MailProvider/models/IMailProvider';
import path from 'path';

interface IRequest {
  email: string;
  name: string;
  code: string;
}

@injectable()
class SendLoginEmailCodeService {
  constructor(
    @inject('MailProvider')
    private mailProvider: IEmailProvider,
  ) {}

  public async execute({ name, email, code }: IRequest): Promise<void> {
    const canSendEmail = process.env.MAIL_BYPASS !== 'true';

    if (!canSendEmail) {
      console.log(`DAppGenius login code for ${email}: ${code}`);
      return;
    }

    const template = path.resolve(__dirname, '..', 'views', 'login-code.hbs');

    await this.mailProvider.sendMail({
      to: {
        name,
        email,
      },
      subject: '[DAppGenius] Your login code',
      templateData: {
        file: template,
        variables: {
          name: name.split(' ')[0],
          code,
        },
      },
    });
  }
}

export default SendLoginEmailCodeService;
