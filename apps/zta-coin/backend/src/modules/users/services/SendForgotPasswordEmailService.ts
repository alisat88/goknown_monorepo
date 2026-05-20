import { injectable, inject } from 'tsyringe';
import IUsersRepository from '../repositories/IUsersRepository';
import IEmailProvider from '@shared/container/providers/MailProvider/models/IMailProvider';
import IUsersTokensRepository from '../repositories/IUsersTokensRepository';
import AppError from '@shared/errors/AppError';
import path from 'path';
import nodes from '@config/nodes';
import { api } from '@config/api';

interface IRequest {
  email: string;
  masterNode?: boolean;
  token?: string;
}

@injectable()
class SendForgotPasswordEmailService {
  constructor(
    @inject('UsersRepository')
    private userRepository: IUsersRepository,
    @inject('MailProvider')
    private mailProvider: IEmailProvider,
    @inject('UsersTokenRepository')
    private usersTokensRepository: IUsersTokensRepository,
  ) { }

  public async execute({
    email,
    masterNode,
    token: newToken,
  }: IRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError('User does not exists.');
    }

    const canSendEmail = process.env.MAIL_BYPASS !== 'true';

    if (!canSendEmail) {
      throw new AppError('Email settings are not enabled.');
    }

    const { token } = await this.usersTokensRepository.generate(
      user.id,
      newToken,
    );

    const forgotPasswordtemplate = path.resolve(
      __dirname,
      '..',
      'views',
      'forgot_password.hbs',
    );

    await this.mailProvider.sendMail({
      to: {
        name: user.name,
        email: user.email,
      },
      subject: '[DAppGenius] Forgot password',
      templateData: {
        file: forgotPasswordtemplate,
        variables: {
          name: user.name.split(' ')[0],
          link: `${process.env.APP_WEB_URL}/reset-password?token=${token}`,
        },
      },
    });

    if (masterNode) {
      // mirror users across nodes
      nodes.map(node =>
        api.post(`${node.url}/forgot`, {
          email,
          masterNode,
          token,
        }),
      );
    }
  }
}

export default SendForgotPasswordEmailService;
