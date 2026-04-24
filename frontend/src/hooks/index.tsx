import React from "react";

// import { GuestProvider } from "./guest";
import { SkeletonTheme } from "react-loading-skeleton";

import { ChakraProvider } from "@chakra-ui/react";

import { AuthProvider } from "./auth";
import { DialogProvider } from "./dialog";
import { SocketProvider } from "./socket";
import { ToastProvider } from "./toast";

const AppProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => (
  // <GuestProvider>
  <ChakraProvider>
    <AuthProvider>
      <SocketProvider>
        <SkeletonTheme baseColor="#e9e9e9" highlightColor="#3333">
          <DialogProvider>
            <ToastProvider>{children}</ToastProvider>
          </DialogProvider>
        </SkeletonTheme>
      </SocketProvider>
    </AuthProvider>
  </ChakraProvider>
  // </GuestProvider>
);

export default AppProvider;
