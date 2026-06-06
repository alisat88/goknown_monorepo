import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import IUsersRepository from '../repositories/IUsersRepository';
import IHashProvider from '../providers/HashProvider/models/IHashProvider';
import IPinProvider from '../providers/PinProvider/models/IPinProvider';
import IEmailProvider from '@shared/container/providers/MailProvider/models/IMailProvider';
import path from 'path';

interface IRequest {
  email: string;
  masterNode?: boolean;
  pin?: string;
}

@injectable()
class SendNewPinEmailService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('PinProvider')
    private pinProvider: IPinProvider,

    @inject('HashProvider')
    private hashProvider: IHashProvider,

    @inject('MailProvider')
    private mailProvider: IEmailProvider,
  ) {}

  public async execute({ email, masterNode, pin }: IRequest): Promise<string> {
    // find user to check if exists
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new AppError('email does not exists');
    }
    if (!pin) {
      pin = await this.pinProvider.generatePin();
    }

    const hashedNewPint = await this.hashProvider.generateHash(pin);

    user.pin = hashedNewPint;
    user.pin_created_at = new Date();

    await this.usersRepository.save(user);

    const canSendEmail = process.env.MAIL_BYPASS !== 'true';

    if (!canSendEmail) {
      console.log(`DAppGenius email confirmation PIN for ${email}: ${pin}`);
      return pin;
    }

    if (masterNode) {
      const resendpintTemplate = path.resolve(
        __dirname,
        '..',
        'views',
        'resendpin.hbs',
      );

      await this.mailProvider.sendMail({
        to: {
          name: user.name,
          email,
        },
        subject: '[DAppGenius] Resend Pin',
        templateData: {
          file: resendpintTemplate,
          variables: {
            name: user.name,
            pin,
            link: `${process.env.APP_WEB_URL}/confirm-email?email=${user.email}`,
          },
        },
      });
    }

    return pin;
  }
}

export default SendNewPinEmailService;
