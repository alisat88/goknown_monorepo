/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
