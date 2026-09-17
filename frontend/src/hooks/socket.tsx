import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

import { useAuth } from "./auth";

interface ISocketContextData {
  socket: Socket;
}

const SocketContext = createContext<ISocketContextData>(
  {} as ISocketContextData
);

// Get socket URL based on environment, similar to API configuration
const getSocketURL = (): string => {
  const environment = process.env.REACT_APP_ENVIRONMENT || "production";

  // For socket.io, use a dedicated env variable if available, otherwise derive from API URL
  const socketURL = process.env.REACT_APP_SOCKET_URL;
  if (socketURL) {
    return socketURL.replace(/\/$/, "");
  }

  const socketAddresses: any = {
    development: "http://localhost:3333", // Browser needs localhost for socket connections
    staging:
      process.env.REACT_APP_STAGING_API?.replace(/\/$/, "") ||
      "https://backend.goknown.app",
    production:
      process.env.REACT_APP_PRODUCTION_API?.replace(/\/$/, "") ||
      "https://node1.goknown.app",
  };

  return socketAddresses[environment] || socketAddresses.production;
};

const SocketProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { user } = useAuth();
  const token = localStorage.getItem("@GoKnown:token");
  const [socketIO] = useState(() =>
    io(getSocketURL(), {
      path: "/socket.io",
      autoConnect: false,
    })
  );
  useEffect(() => {
    socketIO.disconnect();
    if (user?.sync_id && token) {
      socketIO.auth = { token };
      socketIO.connect();
    }
    return () => {
      socketIO.disconnect();
    };
  }, [socketIO, user?.sync_id, token]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketIO,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

function useSocket(): ISocketContextData {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within an AuthProvider");
  }

  return context;
}

export { SocketProvider, useSocket };

// export const socket = io("http://localhost:3333", { path: "/socket.io" });
// export const SocketContext = createContext(socket);
