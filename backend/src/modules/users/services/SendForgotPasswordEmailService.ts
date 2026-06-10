import { injectable, inject } from 'tsyringe';
import IUsersRepository from '../repositories/IUsersRepository';
import IEmailProvider from '@shared/container/providers/MailProvider/models/IMailProvider';
import IUsersTokensRepository from '../repositories/IUsersTokensRepository';
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
      return;
    }

    const canSendEmail = process.env.MAIL_BYPASS !== 'true';

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

    const appWebUrl = (
      process.env.APP_WEB_URL || 'https://dappgenius.dev'
    ).replace(/\/$/, '');
    const resetLink = `${appWebUrl}/reset-password?token=${token}`;
    const name = user.name || user.email;

    if (!canSendEmail) {
      return;
    }

    await this.mailProvider.sendMail({
      to: {
        name,
        email: user.email,
      },
      subject: '[DAppGenius] Forgot password',
      templateData: {
        file: forgotPasswordtemplate,
        variables: {
          name: name.split(' ')[0],
          link: resetLink,
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
