import React, { useCallback, useEffect, useRef, useState } from "react";

import ButtonBack from "../../components/ButtonBack";
import { useAuth } from "../../hooks/auth";
import api from "../../services/api";
import AdminLog from "./AdminLog";
import { Container, Content, Schedule } from "./styles";
import UserLog from "./UserLog";

export type IUserItem = {
  id: string;
  sync_id: string;
  name: string;
  email?: string;
  value?: string;
  label?: string;
  avatar?: string;
  avatar_url?: string;
  firstName?: string;
};

type IUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string;
};

export type IAuditLogsItem = {
  id: string;
  user_id: string;
  sync_id: string;
  action: string;
  dapp: string;
  dapp_token: string;
  dapp_token_sync_id: string;
  nodes: any;
  leader_node: string;
  created_at: string;
  user: IUser;
};

export type INodesItem = {
  outcome: string;
  node: string;
  message?: any;
  created_at: string;
};

const ITEMS_PER_PAGE = 100;

const Auditlogs: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [selectedUser, setSelectedUser] = useState<IUserItem>();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<IAuditLogsItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [logType, setLogType] = useState<string>("All");

  // Use ref to track offset to avoid re-render loops
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);
  const initialLoadDone = useRef(false);

  const { user } = useAuth();

  const handleSelectedUser = useCallback((value: any) => {
    if (value) {
      setSelectedUser({
        id: value.id,
        name: value.label,
        firstName: value.firstName,
        ...value,
      });
    } else {
      setSelectedUser(undefined);
    }
    // Reset pagination when user changes
    offsetRef.current = 0;
    setLogs([]);
    setHasMore(true);
    initialLoadDone.current = false;
  }, []);

  const handleSelectFilter = useCallback(
    async (value: string) => {
      setLogType(value);
      setLoading(true);

      try {
        const response = await api.get<IAuditLogsItem[]>("/auditlogs", {
          params: {
            filtered_user_syncid: selectedUser?.sync_id,
            offset: 0,
            limit: ITEMS_PER_PAGE,
            logType: value,
          },
        });

        offsetRef.current = ITEMS_PER_PAGE;
        setLogs(response.data);
        setHasMore(response.data.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("Error filtering logs:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedUser?.sync_id]
  );

  const loadLogs = useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const response = await api.get<IAuditLogsItem[]>("/auditlogs", {
        params: {
          filtered_user_syncid: selectedUser?.sync_id,
          offset: offsetRef.current,
          limit: ITEMS_PER_PAGE,
          logType: logType,
        },
      });

      if (response.data.length === 0) {
        setHasMore(false);
        return;
      }

      // Update offset for next load
      offsetRef.current += ITEMS_PER_PAGE;

      // Append new logs to existing ones
      setLogs((prevLogs) => [...prevLogs, ...response.data]);

      // Check if there might be more data
      setHasMore(response.data.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedUser?.sync_id, logType]);

  // Initial load - only run once when component mounts or when selectedUser changes
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadLogs();
    }
  }, [loadLogs]);

  // Reset and reload when selectedUser changes
  useEffect(() => {
    if (selectedUser !== undefined || logs.length === 0) {
      return;
    }
    // This handles the case when user is cleared
  }, [selectedUser, logs.length]);

  return (
    <Container mobileHeight={100} height={100}>
      <header>
        <div>
          <ButtonBack
            title="Audit Logs"
            mobileTitle="Audit Logs"
            goTo={"/dashboard"}
          />
        </div>
      </header>
      <Content>
        <Schedule>
          {user.role === "admin" ? (
            <AdminLog
              hasMore={hasMore}
              loading={loading}
              logsData={logs}
              handleSelectedUser={handleSelectedUser}
              handleSelectFilter={handleSelectFilter}
              selectedUser={selectedUser}
              loadLogs={loadLogs}
            />
          ) : (
            <UserLog loading={loading} logsData={logs} />
          )}
        </Schedule>
      </Content>
    </Container>
  );
};

export default Auditlogs;
