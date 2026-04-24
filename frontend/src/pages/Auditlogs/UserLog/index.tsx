import { format, parseISO } from "date-fns";
import React, { useCallback } from "react";
import { FiInfo } from "react-icons/fi";

import Button from "../../../components/Button";
import ListItemLoader from "../../../components/ContentLoader/LisItemLoader";

import { IAuditLogsItem } from "..";

import { useDialog } from "../../../hooks/dialog";
import { Avatar } from "../../../styles/global";
import {
  Column,
  FlagToken,
  List,
  ListHeader,
  ListItem,
  LogInfo,
} from "../styles";

// import { Container } from './styles';

type UserLogData = {
  loading: boolean;
  logsData: IAuditLogsItem[];
};

const UserLog: React.FC<React.PropsWithChildren<UserLogData>> = ({
  loading,
  logsData,
}: UserLogData) => {
  const { showDialog } = useDialog();

  // const renderFormFilter = useCallback(() => {
  //   if (user.role !== "admin") {
  //     return <></>;
  //   }
  //   return (
  //     <Form ref={formRef} onSubmit={handleSubmit}>
  //       <AsyncSelect
  //         name="recipient"
  //         type="avatar"
  //         margin="0 0 18px 0"
  //         onChange={(value: any) =>
  //           value
  //             ? setSelectedUser({
  //                 id: value.id,
  //                 name: value.label,
  //                 firstName: value.firstName,
  //                 ...value,
  //               })
  //             : setSelectedUser(undefined)
  //         }
  //         isClearable
  //         value={selectedUser}
  //         isLoading={asyncLoading}
  //         placeholder="Find user"
  //         loadOptions={loadUsers}
  //       />
  //     </Form>
  //   );
  // }, [asyncLoading, loadUsers, selectedUser, user.role]);

  const formattedDate = useCallback(
    (date: string) => format(parseISO(date), "M/d/yyyy h:mm:s a"),
    []
  );

  const downloadLog = (log: any) => {
    // create file in browser
    const fileName = `${log.user.name} Audit Logs ${new Date()}`;
    const json = JSON.stringify(log, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);

    // create "a" HTLM element with href to file
    const link = document.createElement("a");
    link.href = href;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const LogInfoTemplate = useCallback(
    (log: any) => {
      return (
        <LogInfo>
          <ul>
            <li>
              <strong>User: {log.user.name}</strong>
            </li>
            <li>
              <strong>Token ID:</strong> <p>{log.dapp_token}</p>
            </li>
            <li>
              <strong>Action:</strong> <p>{log.action}</p>
            </li>
            <li>
              <strong>Leader Node:</strong>
              <p>{log.leader_node}</p>
            </li>

            <li>
              <strong>Outcome:</strong>
              <p>{log.nodes.find((l: any) => l.name === log.name).outcome}</p>
            </li>

            <li
              style={{
                paddingTop: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <strong style={{ marginRight: "1rem" }}>NODES:</strong>
              <ul>
                {log.nodes.map((node: any) => (
                  <li>
                    <strong>
                      {node.node} - {node.outcome}
                    </strong>
                    <p>{formattedDate(node.created_at)}</p>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          <Button onClick={() => downloadLog(log)}>Download JSON</Button>
        </LogInfo>
      );
    },

    [formattedDate]
  );

  const handleLogInfo = useCallback(
    (log: any) => {
      console.log(log);
      showDialog({
        cancelButtonText: "Close",
        showCancelButton: false,
        showConfirmButton: false,
        title: `Information`,
        html: LogInfoTemplate(log),
      });
    },
    [LogInfoTemplate, showDialog]
  );

  return loading ? (
    <ListItemLoader />
  ) : (
    <>
      {/* {renderFormFilter()} */}

      {!loading && logsData.length === 0 ? (
        <header>
          <p>No logs found</p>
        </header>
      ) : (
        <List>
          <ListHeader>
            <Column flex={0.3}>User</Column>
            <Column></Column>
            <Column flex={2}>DApp</Column>
            <Column flex={0.5}>Action</Column>
            <Column flex={0.3}></Column>
          </ListHeader>
          {!loading &&
            logsData.map((log) => (
              <ListItem key={log.id}>
                <Column flex={0.3}>
                  <Avatar round name={log.user.name} />
                </Column>
                <Column>
                  <p>{log.user.name}</p>
                  <span>{log.user.role}</span>
                </Column>

                <Column flex={2}>
                  <p>{log.dapp}</p>
                  <FlagToken>{log.dapp_token_sync_id}</FlagToken>
                </Column>

                <Column flex={0.5}>
                  <p>{log.action}</p>
                </Column>
                <Column flex={0.3}>
                  <button onClick={(event) => handleLogInfo(log)}>
                    <FiInfo />
                  </button>
                </Column>
              </ListItem>
            ))}
        </List>
      )}
    </>
  );
};

export default UserLog;
