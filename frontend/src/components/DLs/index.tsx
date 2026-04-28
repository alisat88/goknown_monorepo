import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
// import { V4Options } from "uuid";

import { useAuth } from "../../hooks/auth";
import { IDL } from "../../pages/Organizations/types";
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
                  as="a"
                  key={index}
                  href={dl.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
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
