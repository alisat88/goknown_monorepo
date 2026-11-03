/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IMailProvider from '../models/IMailProvider';
import ISendMailDTO from '../dtos/ISendMailDTO';

/**
 * Implementação de MailProvider que não faz nada (No Operation).
 * Usado quando MAIL_BYPASS=true para evitar erros de injeção de dependência
 * sem precisar enviar emails reais.
 */
export default class NoopMailProvider implements IMailProvider {
  public async sendMail(_: ISendMailDTO): Promise<void> {
    // Does nothing, just simulates that email was sent
    console.log('Email sending bypassed (MAIL_BYPASS=true)');
    return Promise.resolve();
  }
}
