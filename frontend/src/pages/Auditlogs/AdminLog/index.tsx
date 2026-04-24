import Papa from "papaparse";
import React, { useCallback, useRef, useState } from "react";
import {
  AiFillCaretRight,
  AiFillCaretDown,
  AiFillDownCircle,
  AiOutlinePartition,
} from "react-icons/ai";
import { FiDownload } from "react-icons/fi";
import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "react-spinners/BounceLoader";

import { Tooltip } from "@material-ui/core";
import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { IAuditLogsItem, INodesItem, IUserItem } from "..";

import AsyncSelect from "../../../components/AsyncSelect";
import Button from "../../../components/Button";
import ListItemLoader from "../../../components/ContentLoader/LisItemLoader";
import Select from "../../../components/Select";
import api from "../../../services/api";
import { IOrganizationUserItem } from "../../Organizations/types";
import {
  Container,
  LogList,
  LogItem,
  SubItem,
  Content,
  Filter,
  LoaderContainer,
} from "./styles";

type UserLogData = {
  loading: boolean;
  logsData: IAuditLogsItem[];
  selectedUser?: IUserItem;
  hasMore: boolean;
  handleSelectedUser(value: any): any;
  handleSelectFilter(value: any): any;
  loadLogs(): any;
};

const OPTIONS = [
  {
    label: "All",
    value: "All",
  },
  {
    label: "Folder",
    value: "Folder",
  },
  {
    label: "Authenticate",
    value: "Authenticate",
  },
  {
    label: "Charge",
    value: "Charge",
  },
  {
    label: "Transaction",
    value: "Transaction",
  },
  {
    label: "DataForm",
    value: "DataForm",
  },
  {
    label: "DigitalAsset",
    value: "DigitalAsset",
  },
];

const AdminLog: React.FC<React.PropsWithChildren<UserLogData>> = ({
  loading,
  logsData,
  handleSelectedUser,
  handleSelectFilter,
  selectedUser,
  loadLogs,
  hasMore = false,
}: UserLogData) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [asyncLoading, setAsyncLoading] = useState(false);

  const formRef = useRef<FormHandles>(null);

  const handleLogItemClick = (logId: string) => {
    setExpandedLogId((prevExpandedLogId) =>
      prevExpandedLogId === logId ? null : logId
    );
  };

  const downloadNodeItem = (node: any) => {
    // create file in browser
    const fileName = `${node.node} Audit Logs ${new Date()}`;
    const json = JSON.stringify(node, null, 2);
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

  const renderSubItem = (nodes: INodesItem[]) => {
    console.log(nodes);
    return nodes.map((node, index) => {
      return (
        <div className="node-subitem" key={index}>
          <Tooltip title="Created At">
            <span className="hour">{node.created_at}</span>
          </Tooltip>
          <Tooltip title="Node">
            <span className="hour"> - {node.node}</span>
          </Tooltip>
          <Tooltip title={`${JSON.stringify(node?.message)}`}>
            <span className="hour">
              - {node?.outcome}{" "}
              {node?.message?.responseData?.message
                ? ` - ${node?.message?.responseData?.message}`
                : ""}
            </span>
          </Tooltip>
          <Tooltip title="Download JSON">
            <button
              className="node-subitem-download"
              onClick={() => downloadNodeItem(node)}
            >
              <FiDownload />
            </button>
          </Tooltip>
        </div>
      );
    });
  };

  const convertDataToCSV = useCallback(() => {
    const csvData = logsData.map((log) => {
      const subItems = log.nodes.map((node: any) => {
        return [
          node.created_at,
          node.node,
          node?.outcome,
          node?.message?.responseData?.message || "",
        ];
      });

      return [
        log.created_at,
        log.leader_node,
        log.action,
        log.dapp,
        log.dapp_token_sync_id,
        log.user.name,
        ...subItems.flat(), // Flatten the subItems array
      ];
    });
    const csv = Papa.unparse(csvData, {
      header: true,
    });

    // Cria um elemento de link temporário e inicia o download do CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Audit Logs ${new Date()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [logsData]);

  const downloadLog = () => {
    // create file in browser
    const fileName = `Audit Logs ${new Date()}`;
    const json = JSON.stringify(logsData, null, 2);
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

  const loadUsers = useCallback(async (value: any) => {
    if (value.length > 2) {
      try {
        const response = await api.get<IOrganizationUserItem[]>("/users", {
          params: { name: value },
        });
        return response.data.map((usu: any) => ({
          value: usu.sync_id,
          label: `${usu.name}`,
          firstName: usu.name.split(" ")[0],
          ...usu,
        }));
      } catch (err: any) {
        // setAsyncLoading(false);
        console.log(err);
      } finally {
        setAsyncLoading(false);
      }
    }
  }, []);

  const renderFormFilter = useCallback(() => {
    return (
      <Filter>
        <Form ref={formRef} onSubmit={() => {}}>
          <AsyncSelect
            name="recipient"
            type="avatar"
            margin="0 0 18px 0"
            onChange={(value: any) => handleSelectedUser(value)}
            isClearable
            value={selectedUser}
            isLoading={asyncLoading}
            placeholder="Find user"
            loadOptions={loadUsers}
          />
          {/* log type list */}
          <Select
            icon={AiOutlinePartition}
            name="logType"
            placeholder="Log Type"
            options={OPTIONS}
            type="normal"
            onChange={(value: any) => handleSelectFilter(value.value)}
            defaultValue={OPTIONS[0]}
          />
        </Form>
        <div className="actions">
          <Button onClick={convertDataToCSV}>Download CSV</Button>
          <Button onClick={downloadLog}>Download JSON</Button>
        </div>
      </Filter>
    );
  }, [
    asyncLoading,
    convertDataToCSV,
    downloadLog,
    handleSelectFilter,
    handleSelectedUser,
    loadUsers,
    selectedUser,
  ]);

  return (
    <Container>
      {renderFormFilter()}

      <Content id="scrollableDiv">
        {loading && (
          <LoaderContainer>
            <Loader />
          </LoaderContainer>
        )}

        <LogList>
          {logsData.length === 0 && (
            <LogItem>
              <span className="hour">No AuditLogs Found</span>
            </LogItem>
          )}

          <InfiniteScroll
            scrollableTarget="scrollableDiv"
            dataLength={logsData.length} // This is important field to render the next data
            next={() => loadLogs()}
            hasMore={hasMore}
            loader={<></>}
            refreshFunction={() => alert("refresh")}
            endMessage={
              <p style={{ textAlign: "center" }}>
                <b>Yay! You have seen it all</b>
              </p>
            }
            // below props only if you need pull down functionality
            // refreshFunction={this.refresh}
            pullDownToRefresh
            pullDownToRefreshThreshold={150}
            pullDownToRefreshContent={
              <h3 style={{ textAlign: "center" }}>
                &#8595; Pull down to refresh
              </h3>
            }
            releaseToRefreshContent={
              <h3 style={{ textAlign: "center" }}>
                &#8593; Release to refresh
              </h3>
            }
          >
            {logsData.map((log, index) => (
              <>
                <LogItem key={index} onClick={() => handleLogItemClick(log.id)}>
                  {/* Ícone de seta para baixo quando expandido e seta para direita quando contraído */}
                  <span>
                    {expandedLogId === log.id ? (
                      <AiFillCaretDown />
                    ) : (
                      <AiFillCaretRight />
                    )}
                  </span>

                  <Tooltip title="Created At">
                    <span className="hour">{log.created_at}</span>
                  </Tooltip>

                  <Tooltip title="Leader Node">
                    <span className="flag leader">{log.leader_node}</span>
                  </Tooltip>

                  <Tooltip title="Action">
                    <span className="action">{log.action}</span>
                  </Tooltip>

                  <Tooltip title="DApp">
                    <span className="dapp">{log.dapp}</span>
                  </Tooltip>

                  <Tooltip title={`Sync ID ${log.dapp_token_sync_id}`}>
                    <span className="flag token">
                      Token: {log.dapp_token_sync_id}
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={`User ${log.user.name} - ${log.user.email} - ${log.user.role}`}
                  >
                    <span>{log.user.name}</span>
                  </Tooltip>

                  {log.nodes.map((node: any, index: number) => (
                    <div key={`${log.id}-${index}`}>
                      <span className={`${node.outcome}`}>
                        {node.node} - {node.outcome}
                      </span>
                    </div>
                  ))}
                </LogItem>
                {expandedLogId === log.id && (
                  <SubItem>{renderSubItem(log.nodes)}</SubItem>
                )}
              </>
            ))}
          </InfiniteScroll>
        </LogList>
      </Content>
    </Container>
  );
};

export default AdminLog;
