import { format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiDatabase,
  FiEdit,
  FiGrid,
  FiMenu,
  FiPower,
  FiSettings,
  FiShield,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import { useHistory, Link, useLocation } from "react-router-dom";

import logoImg from "../../assets/ZTA.png";
import Asset, { AssetTypes } from "../../components/Asset";
import { TransactionsLoader } from "../../components/ContentLoader";
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
  Content,
  DashboardPanel,
  DashboardShell,
  MainArea,
  MetricCard,
  MetricsGrid,
  MobileMenuButton,
  PanelHeader,
  Profile,
  Schedule,
  Section,
  Sidebar,
  SidebarAction,
  SidebarBrand,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  TopBar,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const history = useHistory();
  const { pathname } = useLocation();
  const { addToast } = useToast();
  const { signOut, user } = useAuth();

  const selectedDateAsText = useMemo(() => {
    return format(selectedDate, "MMMM dd, y");
  }, [selectedDate]);

  const visibleApps = useMemo(
    () =>
      Defaultdls.filter((dl) => {
        if (!dl.roles) return true;
        return dl.roles.includes(user.role);
      }),
    [user.role]
  );

  const assetCount = dashboard?.adminAssets?.assets?.length || 0;

  const handleGoTo = useCallback(
    (to: string, oldPage = "/dashboard") => {
      history.push(to, {
        oldPage,
        folderId: null,
      });
      setSidebarOpen(false);
    },
    [history]
  );

  const isActiveRoute = useCallback(
    (route: string) => {
      if (pathname === "/dashboard" && route === "/digitalassets") return true;
      return pathname === route || pathname.startsWith(`${route}/`);
    },
    [pathname]
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
      <MobileMenuButton
        type="button"
        onClick={() => setSidebarOpen((state) => !state)}
      >
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </MobileMenuButton>

      <DashboardShell>
        <Sidebar $isOpen={sidebarOpen}>
          <SidebarBrand>
            <img src={logoImg} alt="DAppGenius" />
            <div>
              <strong>DAppGenius</strong>
              <span>GoKnown workspace</span>
            </div>
          </SidebarBrand>

          <SidebarNav>
            {visibleApps.map((dl) =>
              dl.externalUrl ? (
                <SidebarNavItem
                  as="a"
                  key={dl.sync_id}
                  href={dl.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  $isActive={false}
                  onClick={() => setSidebarOpen(false)}
                >
                  <img src={dl.icon_url} alt="" />
                  <span>{dl.name}</span>
                </SidebarNavItem>
              ) : (
                <SidebarNavItem
                  key={dl.sync_id}
                  type="button"
                  $isActive={isActiveRoute(dl.route)}
                  onClick={() => handleGoTo(dl.route, dl.oldPage)}
                >
                  <img src={dl.icon_url} alt="" />
                  <span>{dl.name}</span>
                </SidebarNavItem>
              )
            )}
          </SidebarNav>

          <SidebarFooter>
            <SidebarAction type="button" onClick={() => handleGoTo("/profile")}>
              <FiSettings />
              <span>Settings</span>
            </SidebarAction>

            <SidebarAction type="button" onClick={signOut}>
              <FiPower />
              <span>Logout</span>
            </SidebarAction>
          </SidebarFooter>
        </Sidebar>

        <MainArea>
          <TopBar>
            <div>
              <span>{selectedDateAsText}</span>
              <h1>Digital Assets</h1>
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
          </TopBar>

          <Content>
            <MetricsGrid>
              <MetricCard>
                <div>
                  <span>DL Apps</span>
                  <strong>{visibleApps.length}</strong>
                </div>
                <FiGrid />
              </MetricCard>

              <MetricCard>
                <div>
                  <span>Digital Assets</span>
                  <strong>{assetCount}</strong>
                </div>
                <FiDatabase />
              </MetricCard>

              <MetricCard>
                <div>
                  <span>Ledger Status</span>
                  <strong>Secured</strong>
                </div>
                <FiShield />
              </MetricCard>

              <MetricCard>
                <div>
                  <span>Known Network</span>
                  <strong>Active</strong>
                </div>
                <FiTrendingUp />
              </MetricCard>
            </MetricsGrid>

            <Schedule>
              <DashboardPanel>
                <PanelHeader>
                  <div>
                    <span>Recent Known assets</span>
                    <h1>{!loading && dashboard?.adminAssets?.name}</h1>
                  </div>
                </PanelHeader>

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
                      <ContentDigitalAssets
                        key={asset.sync_id}
                        className="dashboard-asset-row"
                      >
                        <div>
                          <Asset
                            url={asset.asset_url}
                            name={asset.name}
                            type={asset.mimetype}
                            onClick={() =>
                              handleGoTo(
                                `/digitalassets/${asset.sync_id}/preview`
                              )
                            }
                          />

                          <InfoDigitalAssets
                            onClick={() =>
                              handleGoTo(
                                `/digitalassets/${asset.sync_id}/preview`
                              )
                            }
                          >
                            <h4>{asset.name}</h4>
                            <strong>{asset.created_at}</strong>
                          </InfoDigitalAssets>

                          {user.role === "admin" && (
                            <button
                              onClick={(event) => {
                                event.preventDefault();
                                handleGoTo(
                                  `/digitalassets/${asset.sync_id}/edit`
                                );
                              }}
                            >
                              <FiEdit />
                            </button>
                          )}
                        </div>
                      </ContentDigitalAssets>
                    ))}
                </AnimatePresence>
              </DashboardPanel>
            </Schedule>
          </Content>
        </MainArea>
      </DashboardShell>
    </Container>
  );
};

export default Dashboard;
