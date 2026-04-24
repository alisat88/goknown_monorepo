import { Twilio } from 'twilio';
import ISMSTwoFactorProvider from '../models/ISMSTwoFactorProvider';

interface IVerifyResponse {
  valid: boolean;
}

export default class SMSTwoFactorProvider implements ISMSTwoFactorProvider {
  private client: Twilio;
  private accountSid: string;
  private authToken: string;
  private serviceSid: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.serviceSid = process.env.TWILIO_SERVICE_ID || '';

    this.client = new Twilio(this.accountSid, this.authToken);
  }

  public async generate(number: string): Promise<void> {
    // generate custom code
    const customCode = Math.floor(1000 + Math.random() * 9000).toString();

    const phone = number.includes('+') ? number : `+${number}`;
    await this.client.verify
      .services(this.serviceSid)
      .verifications.create({ to: phone, channel: 'sms' });
  }

  public async verify(number: string, code: string): Promise<boolean> {
    const phone = number.includes('+') ? number : `+${number}`;
    console.log('phone', phone);
    console.log('code', code);
    try {
      const data: IVerifyResponse = await this.client.verify
        .services(this.serviceSid)
        .verificationChecks.create({ to: phone, code });
      console.log(data);
      return data.valid;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
