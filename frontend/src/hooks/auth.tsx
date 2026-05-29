import React, { createContext, useCallback, useState, useContext } from "react";

import api from "../services/api";
import formatValue from "../utils/formatValue";

interface IConversationItem {
  [conversation_id: string]: number;
}

interface IUser {
  id: string;
  sync_id: string;
  avatar_url: string;
  name: string;
  email: string;
  status: string;
  phone?: string;
  role: "admin" | "buyer" | "seller" | "issuer";
  unread: number;
  conversations?: IConversationItem;
  current_balance: number;
  formattedBalance: string;
  twoFactorAuthentication: boolean;
  hasTwoFactorCode: boolean;
  hasVerfiedTwoFactorCode: boolean;
}
interface IAuthState {
  token: string;
  user: IUser;
}

interface ISignInCredentials {
  email: string;
  password: string;
}

interface IAuthContextData {
  user: IUser;
  signIn(credentails: ISignInCredentials): Promise<IAuthState>;
  completeSignIn(authState: IAuthState): void;
  signOut(): void;
  updateUser(user: IUser): void;
  updateCurrentBalance(amount: number | string, calculate: boolean): void;
}

const AuthContext = createContext<IAuthContextData>({} as IAuthContextData);

const GOKNOWN_STORAGE_PREFIX = "@GoKnown:";
const ENABLE_DEMO_LOGIN = process.env.REACT_APP_ENABLE_DEMO_LOGIN === "true";
const DEMO_LOGIN_EMAIL = process.env.REACT_APP_DEMO_LOGIN_EMAIL;
const DEMO_LOGIN_PASSWORD = process.env.REACT_APP_DEMO_LOGIN_PASSWORD;

function clearGoKnownSessionState() {
  const clearStorage = (storage: Storage) => {
    const keys = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);

      if (key?.startsWith(GOKNOWN_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }

    keys.forEach((key) => storage.removeItem(key));
  };

  clearStorage(localStorage);
  clearStorage(sessionStorage);

  delete api.defaults.headers.authorization;
  delete api.defaults.headers.pre_authenticated;
}

const AuthProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  // lookup in localStore ig the record contains any data
  const [data, setData] = useState<IAuthState>(() => {
    if (window.location.pathname === "/") {
      clearGoKnownSessionState();
    }

    const token = localStorage.getItem("@GoKnown:token");
    const user = localStorage.getItem("@GoKnown:user");

    if (token && user) {
      // attribute the token again when user refresh the page
      api.defaults.headers.authorization = `Bearer ${token}`;
      return { token, user: JSON.parse(user) };
    }

    return {
      user: {},
    } as IAuthState;
  });

  const signIn = useCallback(async ({ email, password }: any) => {
    try {
      if (
        ENABLE_DEMO_LOGIN &&
        email?.trim().toLowerCase() ===
          DEMO_LOGIN_EMAIL?.trim().toLowerCase() &&
        password === DEMO_LOGIN_PASSWORD
      ) {
        // Demo-only frontend access for presenter environments. This is not
        // production authentication and must stay disabled outside demos.
        return {
          token: "demo-local-token",
          user: {
            id: "demo-admin",
            sync_id: "demo-admin",
            avatar_url: "",
            name: "Demo Admin",
            email: DEMO_LOGIN_EMAIL || email,
            status: "active",
            role: "admin",
            unread: 0,
            conversations: {},
            current_balance: 0,
            formattedBalance: formatValue(0),
            twoFactorAuthentication: true,
            hasTwoFactorCode: true,
            hasVerfiedTwoFactorCode: true,
          },
        };
      }

      const response = await api.post("sessions", { email, password });

      const { token, user } = response.data;

      // Modifying to auto-confirm email if status is "confirm_email"
      const updatedUser = {
        ...user,
        status: user.status === "confirm_email" ? "active" : user.status,
        // Demo verification replaces the old SMS/Twilio-style frontend gate.
        hasVerfiedTwoFactorCode: true,
        formattedBalance: formatValue(Number(user.current_balance)),
      };

      return { token, user: updatedUser };
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
      // localStorage.removeItem("@GoKnown:guest_token");
    }
  }, []);

  const completeSignIn = useCallback(({ token, user }: IAuthState) => {
    localStorage.setItem("@GoKnown:token", token);
    localStorage.setItem("@GoKnown:user", JSON.stringify(user));

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, user });
  }, []);

  const signOut = useCallback(() => {
    clearGoKnownSessionState();
    localStorage.removeItem("@GoKnown:token");
    localStorage.removeItem("@GoKnown:user");
    setData({} as IAuthState);
  }, []);

  const updateUser = useCallback(
    (user: IUser) => {
      localStorage.setItem("@GoKnown:user", JSON.stringify(user));
      setData({
        token: data.token,
        user,
      });
    },
    [data.token, setData]
  );

  const updateCurrentBalance = useCallback(
    (amount: any, calculate: any) => {
      const user = localStorage.getItem("@GoKnown:user");
      if (user) {
        const parsedUser = JSON.parse(user);
        const newCurrentBalance = calculate
          ? Number(parsedUser.current_balance) + Number(amount)
          : amount;
        const updatedUser = {
          ...parsedUser,
          current_balance: newCurrentBalance,
          formattedBalance: formatValue(newCurrentBalance),
        };
        localStorage.setItem("@GoKnown:user", JSON.stringify(updatedUser));
        setData({
          token: data.token,
          user: updatedUser,
        });
      }
    },
    [data.token, setData]
  );

  return (
    <AuthContext.Provider
      value={{
        user: data.user,
        signIn,
        completeSignIn,
        signOut,
        updateUser,
        updateCurrentBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): IAuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export { AuthProvider, useAuth };
