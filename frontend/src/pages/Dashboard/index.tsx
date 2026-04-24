import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit, FiPower, FiUser } from "react-icons/fi";
import { useHistory, Link } from "react-router-dom";

import logoImg from "../../assets/logo-white.svg";
import Asset, { AssetTypes } from "../../components/Asset";
import { TransactionsLoader } from "../../components/ContentLoader";
import DLs from "../../components/DLs";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Avatar } from "../../styles/global";

import Defaultdls from "../../utils/getDLs";
import { IUserData } from "../DataForms/store";
import {
  ContentDigitalAssets,
  InfoDigitalAssets,
} from "../DigitalAssets/styles";
import {
  Container,
  Header,
  HeaderContent,
  Profile,
  Content,
  Schedule,
  Section,
  SubHeader,
} from "./styles";

interface IUser {
  id: string;
  name: string;
  avatar: string;
  avatar_url: string;
  email: string;
}

interface IDigitalAssetsItem {
  id: string;
  sync_id: string;
  asset_url: string;
  mimetype: AssetTypes;
  name: string;
  description?: string;
  privacy: "private" | "public";
  created_at: string;
}

interface IDashboardItem {
  adminAssets: {
    id: string;
    sync_id: string;
    name: string;
    user: IUserData;
    assets: IDigitalAssetsItem[];
  };
}

const Dashboard: React.FC = () => {
  const [selectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<IDashboardItem>(
    {} as IDashboardItem
  );

  const history = useHistory();
  const { addToast } = useToast();
  const { signOut, user } = useAuth();

  const selectedDateAsText = useMemo(() => {
    return format(selectedDate, "MMMM dd, y", {
      locale: enUS,
    });
  }, [selectedDate]);

  const handleGoTo = useCallback(
    (to: string) =>
      history.push(to, {
        oldPage: "/dashboard",
        folderId: null,
      }),
    [history]
  );

  useEffect(() => {
    setLoading(true);
    api
      .get("/me/dashboard")
      .then((response) => {
        setDashboard(response.data);
      })
      .catch((err) =>
        addToast({ type: "error", title: "Error", description: err.message })
      )
      .finally(() => setLoading(false));
  }, [addToast]);

  return (
    <Container>
      <Header>
        <HeaderContent>
          <div className="logo">
            <img src={logoImg} alt="DAppGenius" />
          </div>

          <Profile>
            <Avatar
              name={user.name}
              src={user.avatar_url}
              borderColor="#53bf99"
              round
            />

            <div>
              <span>Welcome,</span>
              <Link to="/profile">
                <strong>{user.name}</strong>
              </Link>
            </div>
          </Profile>

          <Link to="/profile">
            <FiUser />
          </Link>

          <button type="button" onClick={signOut}>
            <FiPower />
          </button>
        </HeaderContent>
      </Header>

      <SubHeader />

      <Content>
        {/* ✅ DL Tiles (now includes Payments + Workflow) */}
        <DLs
          title="My DL Apps"
          subtitle={selectedDateAsText}
          dls={Defaultdls}
        />

        <Schedule>
          <h1>{!loading && dashboard?.adminAssets?.name}</h1>

          <AnimatePresence>
            {loading && <TransactionsLoader />}

            {!loading && !dashboard.adminAssets?.id && (
              <Section>
                <header>
                  <p>No data found</p>
                </header>
              </Section>
            )}

            {!loading &&
              dashboard?.adminAssets?.assets?.length > 0 &&
              dashboard.adminAssets.assets.map((asset) => (
                <ContentDigitalAssets key={asset.sync_id}>
                  <div>
                    <Asset
                      url={asset.asset_url}
                      name={asset.name}
                      type={asset.mimetype}
                      onClick={() =>
                        handleGoTo(`/digitalassets/${asset.sync_id}/preview`)
                      }
                    />

                    <InfoDigitalAssets
                      onClick={() =>
                        handleGoTo(`/digitalassets/${asset.sync_id}/preview`)
                      }
                    >
                      <h4>{asset.name}</h4>
                      <strong>{asset.created_at}</strong>
                    </InfoDigitalAssets>

                    {user.role === "admin" && (
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          handleGoTo(`/digitalassets/${asset.sync_id}/edit`);
                        }}
                      >
                        <FiEdit />
                      </button>
                    )}
                  </div>
                </ContentDigitalAssets>
              ))}
          </AnimatePresence>
        </Schedule>
      </Content>
    </Container>
  );
};

export default Dashboard;
