import { set } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FiEdit,
  FiMail,
  FiMoreVertical,
  FiRefreshCcw,
  FiShield,
  FiUserPlus,
} from "react-icons/fi";
import InfiniteScroll from "react-infinite-scroll-component";

import {
  Avatar,
  Badge,
  Box,
  IconButton,
  MenuButton,
  MenuItem,
  MenuList,
  Menu,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  Button,
  Divider,
} from "@chakra-ui/react";

import { ReactComponent as Suffix } from "../../assets/suffix.svg";
import { LoadingContent } from "../../components/Asset/styles";
import ButtonBack from "../../components/ButtonBack";
import api from "../../services/api";
import ActiveOrDeactive from "./activeOrDeactive";
import EditOrCreate, { IEditOrCreateFunctions } from "./editOrCreate";
import IssueNewTokens from "./issueNewTokens";
import ResetPassword from "./resetPassword";
import { Container, Content } from "./styles";
import Upload from "./upload";

export type IUser = {
  id: string;
  sync_id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  avatar_url: string;
  twoFactorAuthentication: boolean;
  twoFactorAuthenticationCode: string;
  role: "admin" | "buyer" | "seller" | "issuer";
  status: "active" | "confirm_email" | "inactive" | "pending";
  pin: string;
  pin_created_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
};

type IFilter = {
  limit: number;
  offset: number;
};

const COLORS_BEDGE = {
  active: "green",
  confirm_email: "yellow",
  inactive: "red",
  pending: "gray",
};

const InviteUser: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [users, setUsers] = useState([] as IUser[]);
  const [selectedUser, setSelectedUser] = useState({} as IUser);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState<IFilter>({ limit: 30, offset: 0 });

  const editOrCreateRef = useRef<IEditOrCreateFunctions>();

  const findUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<IUser[]>("/users", {
        params: filter,
      });

      setUsers([...users, ...response.data]);
      setFilter({ ...filter, offset: filter.offset + filter.limit });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleUpdateUser = (updatedUser: IUser) => {
    const updatedUsers = users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user
    );

    setUsers(updatedUsers);
  };

  const handleAddUser = (newUser: IUser) => {
    const updatedUsers = [...users, newUser];

    setUsers(updatedUsers);
  };

  useEffect(() => {
    findUsers();
  }, []);

  return (
    <Container mobileHeight={90} height={90}>
      <header>
        <div>
          <ButtonBack title="Users" mobileTitle="Users" goTo={"/dashboard"} />

          <Upload />
          <EditOrCreate
            ref={editOrCreateRef}
            updateUser={(updatedUser) => handleUpdateUser(updatedUser)}
            addUser={(newUser) => handleAddUser(newUser)}
          />
        </div>
      </header>
      <Content>
        {loading && <LoadingContent isLoading />}
        {users.length > 0 && (
          <TableContainer width="100%">
            <InfiniteScroll
              dataLength={users.length} // This is important field to render the next data
              next={() => findUsers()}
              hasMore={true}
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
              pullDownToRefreshThreshold={50}
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
              <Table variant="striped" size="sm" className="table-tiny">
                {/* <TableCaption>Users list</TableCaption> */}
                <Thead>
                  <Tr>
                    <Th width="15%" />
                    <Th>Name</Th>
                    {/* <Th>Email</Th> */}
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th isNumeric>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((user) => (
                    <Tr key={user.id}>
                      <Td width="15%">
                        <Avatar src={user.avatar_url} name={user.name} />
                      </Td>
                      <Td>
                        <Box>
                          <Text fontWeight="semibold">{user.name}</Text>
                          <Text fontSize="xs" colorScheme="gray">
                            {user.email}
                          </Text>
                        </Box>
                      </Td>
                      {/* <Td></Td> */}
                      <Td>
                        <Badge>{user.role}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={COLORS_BEDGE[user.status]}>
                          {user.status}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="Options"
                            icon={<FiMoreVertical />}
                            variant="solid"
                            colorScheme="blue"
                          />
                          <MenuList>
                            <MenuItem
                              minH="40px"
                              icon={<FiEdit size={20} />}
                              isDisabled={
                                user.status === "inactive" ||
                                user.status === "pending"
                              }
                              onClick={() =>
                                editOrCreateRef.current?.openEditModal(user)
                              }
                            >
                              Edit
                            </MenuItem>
                            <Divider />
                            {/* <MenuItem
                            minH="40px"
                            icon={<FiRefreshCcw size={20} />}
                          >
                            Reset Password
                          </MenuItem> */}
                            <ResetPassword user={user} />
                            <Divider />
                            <IssueNewTokens user={user} />
                            <Divider />
                            <ActiveOrDeactive
                              user={user}
                              updateUser={(updatedUser) =>
                                handleUpdateUser(updatedUser)
                              }
                            />
                            <Divider />
                            {/* <MenuItem
                            minH="40px"
                            icon={<FiMail size={20} />}
                            isDisabled={["confirm_email", "inactive"].includes(
                              user.status
                            )}
                          >
                            Resend Confirmation Email
                          </MenuItem> */}
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
                <Tfoot>
                  <Tr>
                    <Th width="15%" />
                    <Th>Name</Th>
                    {/* <Th>Email</Th> */}
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th isNumeric>Actions</Th>
                  </Tr>
                </Tfoot>
              </Table>
            </InfiniteScroll>
          </TableContainer>
        )}
      </Content>
    </Container>
  );
};

export default InviteUser;
