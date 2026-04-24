import React from "react";
import {
  RouteProps as ReactDOMRouteProps,
  Route as ReactDOMRoute,
  Redirect,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../hooks/auth";
import DefaultLayout from "../pages/_layouts/DefaultLayout";
import ConfirmEmail from "../pages/ConfirmEmail";
import ExternalFormBuilder from "../pages/ExternalFormBuilder";
import FinishRegistration from "../pages/FinishRegistration";
import { TwoFactorSMS } from "../pages/TwoFactorSMS";
// import { useGuest } from "../hooks/guest";

// Environment variable for SMS verification bypass
const BYPASS_SMS_2FA = process.env.REACT_APP_BYPASS_SMS_2FA === "true";

interface IRouteProps extends ReactDOMRouteProps {
  isPrivate?: boolean;
  // isGuest?: boolean;
  component: React.ComponentType<React.PropsWithChildren<unknown>>;
  path: string;
}

const Route: React.FC<React.PropsWithChildren<IRouteProps>> = ({
  isPrivate = false,
  // isGuest = false,
  component: Component,
  path,
  ...rest
}) => {
  const { user } = useAuth();
  // const { guest_token } = useGuest();
  const { search } = useLocation();
  const userIsEmpty = Object.keys(user || {}).length === 0;
  return (
    <ReactDOMRoute
      path={path}
      {...rest}
      render={({ location }) => {
        // console.log(isGuest, !!guest_token)
        // if(isGuest !== !!guest_token){
        //   console.log("AEEE")
        //  return <Redirect to={{pathname: !!guest_token ? "/" : "guest"}}/>
        // }else{

        if (!userIsEmpty && user.status === "pending") {
          return <FinishRegistration />;
        }

        if (!userIsEmpty) {
          // Check if bypass is active, otherwise apply 2FA verification
          if (
            !BYPASS_SMS_2FA &&
            user.twoFactorAuthentication &&
            !user.hasVerfiedTwoFactorCode
          ) {
            return <TwoFactorSMS />;
          }
        }

        if (userIsEmpty && location.pathname.includes("confirm-email-denied")) {
          return <ConfirmEmail />;
        }

        if (location.pathname.includes("formbuilder")) {
          return <ExternalFormBuilder />;
        }

        return isPrivate === !userIsEmpty ? (
          <DefaultLayout>
            <Component />
          </DefaultLayout>
        ) : (
          <Redirect
            to={{
              pathname: isPrivate ? "/" : "dashboard",
              state: { from: location }, // mantem o historico de redirecionamento
              search,
            }}
          />
        );

        // return isPrivate === !userIsEmpty ? (
        //   <Component />
        // ) : (
        //   <Redirect
        //     to={{
        //       pathname: isPrivate
        //         ? "/"
        //         : !!user && user.status === "confirm_email"
        //         ? `confirm-email`
        //         : "dashboard",
        //       state: { from: location }, // mantem o historico de redirecionamento
        //       search: search,
        //     }}
        //   />
        // );
      }}
      // }}
    />
  );
};

export default Route;
