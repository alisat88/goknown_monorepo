import { container } from 'tsyringe';
import mailConfig from '@config/mail';

import IMailProvider from '../MailProvider/models/IMailProvider';

import EtherealMailProvider from './implementations/EtherealMailProvider';
import SESMailProvider from './implementations/SESMailProvider';
import SMTPMailProvider from './implementations/SMTPMailProvider';
import NoopMailProvider from './implementations/NoopMailProvider';

const bypassEmail = process.env.MAIL_BYPASS === 'true';

const providers = {
  ethereal: container.resolve(EtherealMailProvider),
  ses: container.resolve(SESMailProvider),
  smtp: container.resolve(SMTPMailProvider),
};

// Se MAIL_BYPASS for true, registra um provider que não faz nada
if (bypassEmail) {
  container.registerInstance<IMailProvider>(
    'MailProvider',
    new NoopMailProvider(),
  );
} else {
  container.registerInstance<IMailProvider>(
    'MailProvider',
    providers[mailConfig.driver],
  );
}
