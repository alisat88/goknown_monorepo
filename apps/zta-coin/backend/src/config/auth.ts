export default {
  jwt: {
    secret: process.env.APP_SECRET || 'default',
    expiresIn: '6000000', // 100minutes
  },
};
