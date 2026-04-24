interface IMailConfig {
  driver: 'ethereal' | 'ses';

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

export default {
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
