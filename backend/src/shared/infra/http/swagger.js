import 'reflect-metadata';
import swaggerAutogen from 'swagger-autogen';
import fs from 'fs';
import path from 'path';

const doc = {
  info: {
    title: 'GoKnown API',
    version: '1.0.1',
    description: `Getting Started with User Registration & Authentication

    1. Register Your User Account:
       - Visit [https://dev.goknown.app/](https://dev.goknown.app/) to register a new user account.

    2. First-time Login & Authentication:
       - After successful registration, log in to your account through the front-end dashboard.
       - During this first login, you will be prompted to set up and verify 2-Factor Authentication (2FA) to ensure the security of your account.

    3. Obtain Authentication Token:
       - Once you've logged in and set up 2FA, return to this API documentation.
       - Navigate to the “Sessions” section and use the 'POST /sessions' endpoint to request your authentication token.

    4. Authorize API Access:
       - Utilize the obtained token to authorize access to all API methods.`,
  },
  host: 'nodedev.goknown.app',
  schemes: ['https'],
  tags: [], // Initialize with empty tags
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'headers',
      name: 'Authorization',
      description:
        'Enter the token with the `Bearer: ` prefix, e.g. "Bearer abcde12345".',
    },
  },
  components: {
    schemas: {
      Session: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
          },
          userId: {
            type: 'integer',
          },
          // Add other properties as needed for the session schema
        },
      },
      Exception: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
          },
          code: {
            type: 'integer',
          },
          // Add other properties as needed for the Exception schema
        },
      },
      // You can add more schemas here if needed
    },
  },
};

const outputFile = '../../../swagger_output.json';
const endpointsDir = '../../../modules';

// Recupere automaticamente as tags com base nos nomes das pastas dentro de modules
const modules = fs.readdirSync(path.join(__dirname, endpointsDir));
// doc.tags = modules.map(moduleName => ({ name: moduleName }));

const endpointsFiles = modules.map(moduleName =>
  path.join(
    __dirname,
    endpointsDir,
    moduleName,
    'infra',
    'http',
    'routes',
    '*.routes.js',
  ),
);

swaggerAutogen()(outputFile, endpointsFiles, doc).then(async () => {
  // await import('./server');
  console.log('DONE');
});
