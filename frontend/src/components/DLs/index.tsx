import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
// import { V4Options } from "uuid";

import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import { IDL } from "../../pages/Organizations/types";
import { launchExternalApp } from "../../utils/launchApp";
import LoaderDLs from "../ContentLoader/LoaderDLs";
import { Card, CardContent, Container } from "./styles";

interface IDlsProps {
  title?: string;
  subtitle?: string;
  dls?: IDL[];
  loading?: boolean;
}

const DLs: React.FC<React.PropsWithChildren<IDlsProps>> = ({
  dls,
  title,
  subtitle,
  loading = false,
}: IDlsProps) => {
  const { user } = useAuth();
  const history = useHistory();
  const { addToast } = useToast();

  const handleLaunchExternal = useCallback(
    (dl: IDL) => {
      if (!dl.externalUrl) return;
      launchExternalApp(dl.externalUrl, dl.flag, {
        onMissingToken: () =>
          addToast({
            type: "error",
            title: "Session expired",
            description: "Please sign in to DAppGenius to open DApp Builder.",
          }),
      });
    },
    [addToast]
  );

  const renderUnRead = useCallback(
    (name: string) => {
      return (
        name === "Messenger" && !!user.unread && <span>{user.unread}</span>
      );
    },
    [user.unread]
  );

  const handleGoTo = useCallback(
    (to: string, oldPage?: string) => history.push(to, { oldPage }),
    [history]
  );

  return (
    <Container>
      {title && <h1>{title}</h1>}
      {subtitle && (
        <p>
          <span>{subtitle || ""}</span>
        </p>
      )}
      {loading ? (
        <LoaderDLs />
      ) : (
        <CardContent>
          {dls?.map((dl, index) => {
            if (dl.roles?.includes(user.role) === false) return null;
            if (dl.externalUrl) {
              return (
                <Card
                  as="button"
                  type="button"
                  key={index}
                  onClick={() => handleLaunchExternal(dl)}
                >
                  <img src={dl.icon_url} alt="dls" width="72" />
                  <p>{dl.name}</p>
                  {renderUnRead(dl.name)}
                </Card>
              );
            }

            return (
              <Card
                key={index}
                onClick={() => handleGoTo(dl.route, dl.oldPage)}
              >
                <img src={dl.icon_url} alt="dls" width="72" />
                <p>{dl.name}</p>
                {renderUnRead(dl.name)}
              </Card>
            );
          })}
        </CardContent>
      )}
    </Container>
  );
};

export default DLs;
