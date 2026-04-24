import React, { createContext, useCallback, useContext, useState } from "react";
import { v4 as uuid } from "uuid";

import DialogContainer from "../components/DialogContainer";

export interface IConfirmProps {
  function(): Promise<void>;
  showLoaderOnConfirm?: boolean;
  successMessage?: string;
  errorMessage?: string;
  timeoutToClose?: number;
  successIcon?: "info" | "question" | "success" | "error" | "warning";
  errorIcon?: "info" | "question" | "success" | "error" | "warning";
}

export interface IDialogMessage {
  id: string;
  isOpen: boolean;
  icon?: "info" | "question" | "success" | "error" | "warning";
  title?: string;
  html?: any;
  timeout?: number;
  redirectTo?: string;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  text?: string;

  confirm?: IConfirmProps;
}

interface IDialogContextData {
  showDialog(message: Omit<IDialogMessage, "id" | "isOpen">): void;
  hideDialog(): void;
}

const DialogContext = createContext<IDialogContextData>(
  {} as IDialogContextData
);

const DialogProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [messages, setMessages] = useState<IDialogMessage>(
    {} as IDialogMessage
  );
  const [isOpen, setIsOpen] = useState(false);

  const showDialog = useCallback(
    async ({
      icon,
      title,
      text,
      timeout,
      html,
      confirmButtonText,
      cancelButtonText,
      showConfirmButton,
      showCancelButton,
      redirectTo,
      confirm,
    }: Omit<IDialogMessage, "id" | "isOpen">) => {
      const id = uuid();

      const toast = {
        id,
        icon,
        title,
        text,
        timeout,
        isOpen: true,
        html,
        showCancelButton,
        showConfirmButton,
        confirmButtonText,
        cancelButtonText,
        redirectTo,
        confirm,
      };
      setIsOpen(true);
      setMessages(toast);
    },
    []
  );

  const hideDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      <>
        {children}
        {DialogContainer(messages)}
      </>
    </DialogContext.Provider>
  );
};

function useDialog(): IDialogContextData {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }

  return context;
}

export { DialogProvider, useDialog };
