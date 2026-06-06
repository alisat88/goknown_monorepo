import { container } from 'tsyringe';
import mailConfig from '@config/mail';

import IMailProvider from '../MailProvider/models/IMailProvider';

import EtherealMailProvider from './implementations/EtherealMailProvider';
import SESMailProvider from './implementations/SESMailProvider';
import SMTPMailProvider from './implementations/SMTPMailProvider';
import NoopMailProvider from './implementations/NoopMailProvider';
import { validateMailConfig } from '@config/mail';

const bypassEmail = process.env.MAIL_BYPASS === 'true';

validateMailConfig();

const providers = {
  ethereal: () => container.resolve(EtherealMailProvider),
  ses: () => container.resolve(SESMailProvider),
  smtp: () => container.resolve(SMTPMailProvider),
};

// Se MAIL_BYPASS for true, registra um provider que não faz nada
if (bypassEmail) {
  container.registerInstance<IMailProvider>(
    'MailProvider',
    new NoopMailProvider(),
  );
} else {
  const selectedProvider = providers[mailConfig.driver as keyof typeof providers];

  if (!selectedProvider) {
    throw new Error(
      `Unsupported MAIL_DRIVER "${mailConfig.driver}". Use ethereal, ses, or smtp.`,
    );
  }

  container.registerInstance<IMailProvider>(
    'MailProvider',
    selectedProvider(),
  );
}
