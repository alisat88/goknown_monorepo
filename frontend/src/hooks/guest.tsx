import React, { useCallback, useContext, useState, createContext } from "react";
import { useHistory } from "react-router-dom";

import api from "../services/api";
// import { Container } from './styles';

interface IGuestState {
  guest_token: string;
}

interface IGuestSignInCredentials {
  password: string;
}

interface IGuestContextData {
  guest_token: string;
  guestSignIn(credentials: IGuestSignInCredentials): Promise<void>;
  guestSignOut(): void;
}

const GuestContext = createContext<IGuestContextData>({} as IGuestContextData);

const GuestProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const history = useHistory();
  const [data, setData] = useState<IGuestState>(() => {
    const guest_token = localStorage.getItem("@GoKnown:guest_token");

    if (guest_token) {
      api.defaults.headers.pre_authenticated = guest_token;
      return { guest_token };
    }

    return {} as IGuestState;
  });

  const guestSignIn = useCallback(async ({ password }: any) => {
    const response = await api.post("/sessions/pre", { password });
    const { preToken } = response.data;

    localStorage.setItem("@GoKnown:guest_token", preToken);

    api.defaults.headers.pre_authenticated = preToken;
    setData(preToken);
    window.location.href = "/";
  }, []);

  const guestSignOut = useCallback(() => {
    localStorage.removeItem("@GoKnown:guest_token");
    setData({} as IGuestState);
  }, []);

  return (
    <GuestContext.Provider
      value={{ guest_token: data.guest_token, guestSignIn, guestSignOut }}
    >
      {" "}
      {children}
    </GuestContext.Provider>
  );
};

function useGuest(): IGuestContextData {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error("useGuest must be use within an GuestProvider");
  }
  return context;
}

export { GuestProvider, useGuest };
