import { injectable, inject } from 'tsyringe';
import aws from 'aws-sdk';
import nodemailer, { Transporter } from 'nodemailer';
import mailConfig from '@config/mail';

import IEmailProvider from '../models/IMailProvider';
import ISendMailDTO from '../dtos/ISendMailDTO';

// Injection was done here, as the template depends on the Mail provider, better to keep everything together.
import IMailTemplateProvider from '@shared/container/providers/MailTemplateProvider/models/IMailTemplateProvider';

@injectable()
class SESMailProvider implements IEmailProvider {
  private client: Transporter;

  constructor(
    @inject('MailTemplateProvider')
    private mailTemplateProvider: IMailTemplateProvider,
  ) {
    this.client = nodemailer.createTransport({
      SES: new aws.SES({
        apiVersion: '2010-12-01',
        region: process.env.AWS_REGION || 'us-east-1',
      }),
    });
  }

  public async sendMail({
    to,
    subject,
    from,
    templateData,
  }: ISendMailDTO): Promise<void> {
    const { name, email } = mailConfig.defaults.from;

    const logo = `https://storage-goknown.sfo3.digitaloceanspaces.com/public/known-logo.png`;

    await this.client.sendMail({
      from: {
        // name: from?.name || name,
        name,
        // address: from?.email || email,
        address: email,
      },
      to: { name: to.name, address: to.email },
      subject,
      html: await this.mailTemplateProvider.parse({
        ...templateData,
        variables: { ...templateData.variables, logo },
      }),
    });
  }
}

export default SESMailProvider;
