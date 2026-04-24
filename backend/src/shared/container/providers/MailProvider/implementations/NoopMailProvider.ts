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
