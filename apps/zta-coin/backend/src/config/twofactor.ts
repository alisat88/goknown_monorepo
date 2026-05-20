interface ITwoFaConfig {
  driver: 'google' | 'sms';
}

export default {
  driver: process.env.TWOFA_DRIVER || 'sms',
} as ITwoFaConfig;
