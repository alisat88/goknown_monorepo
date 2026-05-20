import 'reflect-metadata';
import 'dotenv/config';

import '@shared/infra/typeorm';
// import '@shared/container';

// eslint-disable-next-line import/extensions
import Queue from './lib/Queue';

try {
  Queue.processQueue();
} catch (err) {
  console.log(err);
}
