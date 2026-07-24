import 'reflect-metadata';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { errors } from 'celebrate';
import 'express-async-errors';
import routes from './routes';
import path from 'path';
// import cluster from 'cluster';
// import os from 'os';

import compression from 'compression';

import '@shared/container';
import uploadConfig from '@config/upload';
import AppError from '@shared/errors/AppError';
import SocketServer from './socketIO';
import { initializeDatabase } from '@shared/infra/typeorm';
// import swaggerUi from 'swagger-ui-express';
// import swaggerFile from '../../../swagger_output.json';

/**
 * CLUSTERING SETUP
 */
// if (cluster.isMaster) {
//   const numCPUs = os.cpus().length;
//   console.log(`Master ${process.pid} is running`);

//   // Fork workers (one per CPU core)
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   // Listen for dying workers and restart them
//   // cluster.on('exit', (worker, code, signal) => {
//   //   console.log(`Worker ${worker.process.pid} died. Restarting...`);
//   //   cluster.fork();
//   // });
// } else {
// Workers can share the TCP connection in this case
const app = express();

/**
 * Cors Policy
 */
app.use(cors());

// Enable gzip compression for all responses
app.use(compression());

/**
 * indicate express to accept json files
 */
app.use(express.json());

/**
 * static route to avatars
 */
app.use('/files', express.static(uploadConfig.uploadsFolder));

/**
 * static route to images
 */
app.use(
  '/images',
  express.static(path.resolve(__dirname, '..', '..', 'views', 'images')),
);

/**
 * initialize route file
 */
app.use(routes);

/**
 * initialize handle errors
 */
app.use(errors());
app.use((err: Error, request: Request, response: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    return response
      .status(err.statusCode)
      .json({ status: 'error', message: err.message });
  }

  console.error('Unhandled ZTA request error');
  return response
    .status(500)
    .json({ status: 'error', message: 'Internal Server Error' });
});

/**
 * initialize http server with express app
 */
const server = http.createServer(app);

/**
 * Initialize socket.io server for a specific worker
 */
if (process.env.NODE_NAME === 'NODE1') {
  console.log('Initializing socket server on worker', process.pid);
  SocketServer.init(server);
}

/**
 * initialize swagger UI
 */
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

/**
 * RUN SERVER
 */
const PORT = process.env.PORT || 3333;

export async function startServer(): Promise<void> {
  try {
    await initializeDatabase();
  } catch {
    console.error('ZTA database initialization failed; HTTP server not started');
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}

if (require.main === module) {
  void startServer();
}
// }
