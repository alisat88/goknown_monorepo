import { Server } from 'http';
import socket from 'socket.io';

interface IUserProps {
  usersync_id: string;
  socket_id: string;
}

interface IMessageProps {
  sersync_id: string;
  receiver_id: string;
  conversation_id: string;
  text: string;
}

class SocketServer {
  private io: socket.Server;
  public users: IUserProps[] = [];
  constructor() {}

  public async init(server: Server) {
    if (!this.io) {
      this.io = new socket.Server(server, {
        path: '/socket.io',
        cors: {
          origin: `*`,
        },
      });

      this.connection();
    }
  }

  public async addUser({ usersync_id, socket_id }: IUserProps) {
    !this.users.some(user => user.usersync_id === usersync_id) &&
      this.users.push({ usersync_id, socket_id });
  }

  public async removeUser(socket_id: string) {
    this.users = this.users.filter(user => user.socket_id !== socket_id);
  }

  public getUser(usersync_id: string) {
    return this.users.find(user => user.usersync_id === usersync_id);
  }

  public async connection() {
    this.io.on('connection', socket => {
      // when connect
      console.log('[IO] Connection => Server has a new connection');

      // take userId and socketId from user
      socket.on('addUser', usersync_id => {
        console.log('[IO] Funciton => getUser', this.users.length);
        this.addUser({ usersync_id, socket_id: socket.id });
        this.io.emit('getUsers', this.users);
      });

      // send and get message
      socket.on(
        'sendMessage',
        ({ sender, receiver_id, text, conversation_id }: IMessageProps) => {
          const user = this.getUser(receiver_id);
          console.log(user);
          if (user) {
            this.io.to(user.socket_id).emit('getMessage', {
              sender,
              text,
            });
            this.io
              .to(user.socket_id)
              .emit('newMessage', { conversation_id, receiver_id });
          }
        },
      );
      // socket.on('disconnectUser', () => {
      //   socket.disconnect();
      // });
      // when disconnect
      socket.on('disconnect', () => {
        console.log('[IO] Connection => Server has disconnected');
        this.removeUser(socket.id);
        this.io.emit('getUsers', this.users);
      });
    });
  }
}

export default new SocketServer();
