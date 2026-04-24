import { SES } from 'aws-sdk';
import nodemailer, { Transporter } from 'nodemailer';
import mailConfig from '@config/mail';
import handlebars from 'handlebars';
// Injection was done here, as the template depends on the Mail provider, better to keep everything together.
import ISendMailDTO from '@shared/container/providers/MailProvider/dtos/ISendMailDTO';
import IParseMailTemplateDTO from '@shared/container/providers/MailTemplateProvider/dtos/IParseMailTemplateDTO';
import fs from 'fs';
import path from 'path';
class MailProvider {
  private client: Transporter;

  constructor() {
    this.client = nodemailer.createTransport({
      SES: new SES({
        apiVersion: '2010-12-01',
        region: process.env.AWS_REGION || 'us-east-1',
      }),
    });
  }

  public async parse({
    file,
    variables,
  }: IParseMailTemplateDTO): Promise<string> {
    const templateFileContent = await fs.promises.readFile(file, {
      encoding: 'utf-8',
    });
    const pathFooterTemplate = path.resolve(
      __dirname,
      '..',
      'shared',
      'views',
      'partials',
      'footer.hbs',
    );
    const footerTemplate = await fs.promises.readFile(pathFooterTemplate, {
      encoding: 'utf-8',
    });

    const pathHeaderTemplate = path.resolve(
      __dirname,
      '..',
      'shared',
      'views',
      'partials',
      'header.hbs',
    );

    const headerTemplate = await fs.promises.readFile(pathHeaderTemplate, {
      encoding: 'utf-8',
    });

    handlebars.registerPartial('header', headerTemplate);
    handlebars.registerPartial('footer', footerTemplate);
    const parseTemplate = handlebars.compile(templateFileContent);

    return parseTemplate(variables);
  }

  public async sendMail({
    to,
    subject,
    from,
    templateData,
  }: ISendMailDTO): Promise<void> {
    // const { name, email } = mailConfig.defaults.from;

    const logo = `https://storage-goknown.sfo3.digitaloceanspaces.com/public/known-logo.png`;

    this.client.sendMail({
      from: {
        // name: from?.name || name,
        name: 'DAppGenius APP',
        // address: from?.email || email,
        address: 'no-reply@DAppGenius.com',
      },
      to: { name: to.name, address: to.email },
      subject,
      html: await this.parse({
        ...templateData,
        variables: { ...templateData.variables, logo },
      }),
    });
  }
}

export default new MailProvider();
