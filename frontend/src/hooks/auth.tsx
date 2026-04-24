import React, { createContext, useCallback, useState, useContext } from "react";

import api from "../services/api";
import formatValue from "../utils/formatValue";

// Environment variable for SMS verification bypass
const BYPASS_SMS_2FA = process.env.REACT_APP_BYPASS_SMS_2FA === "true";

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
  signIn(credentails: ISignInCredentials): Promise<void>;
  signOut(): void;
  updateUser(user: IUser): void;
  updateCurrentBalance(amount: number | string, calculate: boolean): void;
}

const AuthContext = createContext<IAuthContextData>({} as IAuthContextData);

const AuthProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  // lookup in localStore ig the record contains any data
  const [data, setData] = useState<IAuthState>(() => {
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
      const response = await api.post("sessions", { email, password });

      const { token, user } = response.data;

      // Modifying to auto-confirm email if status is "confirm_email"
      const updatedUser = {
        ...user,
        status: user.status === "confirm_email" ? "active" : user.status,
        // If bypass is active, mark SMS verification as completed
        hasVerfiedTwoFactorCode: BYPASS_SMS_2FA
          ? true
          : user.hasVerfiedTwoFactorCode,
        formattedBalance: formatValue(Number(user.current_balance)),
      };

      localStorage.setItem("@GoKnown:token", token);
      localStorage.setItem("@GoKnown:user", JSON.stringify(updatedUser));

      api.defaults.headers.authorization = `Bearer ${token}`;

      setData({ token, user: updatedUser });
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
      // localStorage.removeItem("@GoKnown:guest_token");
    }
  }, []);

  const signOut = useCallback(() => {
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
