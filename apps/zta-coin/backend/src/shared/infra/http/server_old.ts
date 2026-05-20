import 'reflect-metadata';
import 'dotenv/config';

// import './swagger';

import express, { Request, Response, NextFunction } from 'express';
// import socket, { Socket } from 'socket.io';
import http from 'http';

import cors from 'cors';
import { errors } from 'celebrate';
import 'express-async-errors';
import routes from './routes';
import path from 'path';

import '@shared/infra/typeorm';
import '@shared/container';

import uploadConfig from '@config/upload';

import AppError from '@shared/errors/AppError';
import nodes from '@config/nodes';
import { container } from 'tsyringe';
import ListAllUsersService from '@modules/users/services/ListAllUsersService';
import SocketServer from './socketIO';

import swaggerUi from 'swagger-ui-express';
import swaggerFile from '../../../swagger_output.json';

/**
 * initialize Express
 */
const app = express();

/**
 * Cors Policy
 */
app.use(cors());

/**
 * indicate express to accept json files
 */
app.use(express.json());

/**
 * static route to avatars
 */
app.use('/files', express.static(uploadConfig.uploadsFolder));

/**
 *
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

  // console.log(err);
  if (process.env.NODE_ENV !== 'production') {
    console.log(err);
  }
  return response
    .status(500)
    .json({ status: 'error', message: 'Internal Server Error' });
});

/**
 * initialize socket.io
 */

// const server = http.createServer(app);
// const io = new socket.Server(server, {
//   cors: { origin: process.env.APP_WEB_URL || '*' },
// });

// interface IMessage {
//   id: string;
//   message: string;
//   from_user_syncid: string;
//   to_user_syncid: string;
// }

// interface IUserItem {
//   id: string;
//   sync_id: string;
//   name: string;
//   email: string;
//   avatar_url: string;
//   socket?: Socket;
//   status: 'online' | 'offline';
//   messages?: IMessage[];
// }

// let usersScoket: IUserItem[] = [];

// io.on('connection', client => {
//   console.log('[IO] Connection => Server has a new connection');
//   if (usersScoket.length === 0) {
//     setTimeout(() => {
//       console.log('ae');
//       const listAllUsersService = container.resolve(ListAllUsersService);
//       listAllUsersService
//         .execute({ status: 'active', name: '' })
//         .then(users => {
//           if (users) {
//             users.map(user => {
//               const { sync_id, id, name, email } = user;
//               return usersScoket.push({
//                 sync_id,
//                 id,
//                 name,
//                 email,
//                 avatar_url: '',
//                 status: 'offline',
//               });
//             });
//           }
//         });
//     }, 2000);
//   }
//   // console.log(client);
//   client.on('chat.connect', syncId => {
//     console.log('user connect ', syncId);
//     // console.log(client.client);
//     usersScoket = usersScoket.map((user: IUserItem) =>
//       user.sync_id === syncId
//         ? { ...user, status: 'online', socket: client }
//         : user,
//     );
//   });

//   client.on('chat.message', (data: IMessage) => {
//     const { to_user_syncid, from_user_syncid } = data;
//     // users[client] = [client, data];
//     console.log('[SOCKET] Chat.message =>', data.message);
//     const userTo = usersScoket.find(user => user.sync_id === to_user_syncid);
//     const userFrom = usersScoket.find(
//       user => user.sync_id === from_user_syncid,
//     );

//     usersScoket = usersScoket.map((user: IUserItem) =>
//       user.sync_id === data.to_user_syncid
//         ? {
//             ...user,
//             status: 'online',
//             socket: client,
//             messages: user.messages ? [...user.messages, data] : [data],
//           }
//         : user,
//     );

//     if (!!userTo && userTo.socket) {
//       userTo.socket.emit('chat.message', data);
//     }
//     if (!!userFrom && userFrom.socket) {
//       userFrom.socket.emit('chat.message', data);
//     }
//   });
//   client.on('disconnect', () => {
//     console.log('[SOCKET] disconnect => A connection was desconnected');
//   });
// });

const server = http.createServer(app);
// const io = new socket.Server(server, {
//   cors: { origin: process.env.APP_WEB_URL || '*' },
// });

// init socket if node 1
if (process.env.NODE_NAME === 'NODE1') {
  console.log('initing socket server');
  SocketServer.init(server);
}

/**
 * initilize swagger UI
 * @see https://swagger.io/tools/swagger-ui/
 */

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

/**
 * RUN SERVER
 */
server.listen(process.env.PORT || 3333, () => {
  console.log(`Server started on port ${process.env.PORT || 3333}`);
});
