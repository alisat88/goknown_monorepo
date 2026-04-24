module.exports = {
  apps: [
    {
      name: 'goknown-backend',
      script: './dist/shared/infra/http/server.js',
      env: {
        NODE_ENV: 'production',
        NODE_EXTRA_CA_CERTS: 'ca-certificate.crt',
      },
    },
  ],
};
