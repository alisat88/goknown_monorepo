interface IMailConfig {
  driver: 'ethereal' | 'ses' | 'smtp';

  defaults: {
    from: {
      email: string;
      name: string;
    };
  };

  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

const mailConfig = {
  driver: process.env.MAIL_DRIVER || 'ethereal',
  defaults: {
    from: {
      email: process.env.MAIL_FROM_EMAIL || 'ekc@goknown.app',
      name: process.env.MAIL_FROM_NAME || 'GoKnown',
    },
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
} as IMailConfig;

export default mailConfig;

export function validateMailConfig(): void {
  if (process.env.MAIL_BYPASS === 'true') {
    return;
  }

  if (mailConfig.driver === 'smtp') {
    const missing = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].filter(
      key => !process.env[key],
    );

    if (missing.length > 0) {
      throw new Error(
        `SMTP mail is enabled but the following env vars are missing: ${missing.join(
          ', ',
        )}.`,
      );
    }
  }

  if (mailConfig.driver === 'ses') {
    const missing = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
    ].filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `SES mail is enabled but the following env vars are missing: ${missing.join(
          ', ',
        )}.`,
      );
    }
  }
}
