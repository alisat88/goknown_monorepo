import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "react-avatar";
import { AiFillFolder, AiFillFolderOpen } from "react-icons/ai";
import { FiEdit, FiPlus, FiUpload } from "react-icons/fi";
import { useHistory, useLocation, useParams } from "react-router-dom";

import groupIcon from "../../assets/group.svg";
import Asset, { AssetTypes, EnumAssetsType } from "../../components/Asset";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import ListItemLoader from "../../components/ContentLoader/LisItemLoader";
import { useAuth } from "../../hooks/auth";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Footer } from "../../styles/global";
import {
  Container,
  Content,
  Schedule,
  ContentDigitalAssets,
  InfoDigitalAssets,
  Flag,
  MyAssets,
  RigthSection,
  FilterList,
  BigButton,
  FolderList,
  FolderAsset,
} from "./styles";

interface IUserData {
  id: string;
  name: string;
  sync_id: string;
  email: string;
  avatar_url: string;
}

interface IGroupData {
  id: string;
  sync_id: string;
  name: string;
}
interface IFoldersItem {
  id: string;
  sync_id: string;
  name: string;
  owner: IUserData;
  shared?: boolean;
  welcome?: boolean;
  editable: boolean;
  shared_users?: IUserData[];
  shared_groups?: IGroupData[];
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
  folder?: {
    name: string;
  };
}

interface IResponseDigitalAssets {
  myassets: IDigitalAssetsItem[];
  publicassets: IDigitalAssetsItem[];
  folders: IFoldersItem[];
}

interface IAssetsState {
  filteredMy: IDigitalAssetsItem[];
  filteredPublic: IDigitalAssetsItem[];
  my: IDigitalAssetsItem[];
  public: IDigitalAssetsItem[];
}

interface IPropsItems {
  name: string;
  filter: string[] | [] | string;
  handleFilter(filter: any): any;
}

interface ILocationsProps {
  oldPage?: string;
}

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

const Item: React.FC<React.PropsWithChildren<IPropsItems>> = ({
  name,
  handleFilter,
  filter,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const isStringFilter = typeof filter === "string";

  const getMimeValue = (name: string) =>
    Object.keys(EnumAssetsType).filter(
      (key) => EnumAssetsType[key as AssetTypes] === name
    );

  const toggleMimeFilter = () => {
    const images: string[] = getMimeValue("image");
    const audios: string[] = getMimeValue("audio");
    const documents: string[] = getMimeValue("document");
    const videos: string[] = getMimeValue("video");
    setIsOpen(!isOpen);

    if (isStringFilter) {
      return handleFilter(name);
    }

    switch (name) {
      case "image":
        return handleFilter(
          !isOpen
            ? [...filter, ...images]
            : filter.filter((f: string) => !images.includes(f))
        );
      case "audio":
        return handleFilter(
          !isOpen
            ? [...filter, ...audios]
            : filter.filter((f: string) => !audios.includes(f))
        );
      case "video":
        return handleFilter(
          !isOpen
            ? [...filter, ...videos]
            : filter.filter((f: string) => !videos.includes(f))
        );
      case "document":
        return handleFilter(
          !isOpen
            ? [...filter, ...documents]
            : filter.filter((f: string) => !documents.includes(f))
        );
      default:
        return handleFilter([]);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        layout
        transition={{ duration: 0.5 }}
        onClick={toggleMimeFilter}
        animate={{
          borderColor: (isStringFilter ? name === filter : isOpen)
            ? "#0057ff"
            : "#D8D8D8",
        }}
      >
        <>
          <motion.span
            initial={{ backgroundColor: "#C0C0C0" }}
            animate={{
              backgroundColor: (isStringFilter ? name === filter : isOpen)
                ? "#0057ff"
                : "#C0C0C0",
              opacity: (isStringFilter ? name === filter : isOpen) ? 0.8 : 1,
            }}
            transition={{ duration: 0.2 }}
            exit={{ opacity: 0 }}
          ></motion.span>
          <motion.p>{name}</motion.p>
        </>
      </motion.div>
    </AnimatePresence>
  );
};

const DigitalAssets: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<IFoldersItem[]>([]);
  const [assets, setAssets] = useState<IAssetsState>({
    filteredMy: [],
    filteredPublic: [],
    my: [],
    public: [],
  } as IAssetsState);
  const [filter, setFilter] = useState<string[]>([]);
  const [order, setOrder] = useState<string>("Z-A");
  const [orderDate, setOrderDate] = useState<string>("Oldest");

  const history = useHistory();

  const items = ["image", "video", "audio", "document"];
  const orderAlphabetically = ["A-Z", "Z-A"];
  const orderByDate = ["Newest", "Oldest"];

  const { addToast } = useToast();
  const { user } = useAuth();
  const location = useLocation<ILocationsProps>();
  const { idGroup, idOrganization, idRoom } = useParams<IParams>();

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }
    window.history.replaceState({}, document.title);
    return "";
  }, [idGroup, idOrganization, idRoom]);

  const handleGoTo = useCallback(
    (to: string) =>
      history.push(to, {
        oldPage: idRoom ? `${baseNavigationPath}/digitalassets` : null,
        folderId: null,
      }),
    [baseNavigationPath, history, idRoom]
  );

  const renderSharedFolder = useCallback(
    (folder: IFoldersItem) => {
      if (idRoom) {
        return <></>;
      }
      if (folder.shared) {
        return (
          <span>
            Shared with:
            {!!folder.shared_users &&
              folder.shared_users.map((user) => (
                <Avatar
                  key={user.sync_id}
                  className="avatar-shared"
                  name={user.name}
                  src={user.avatar_url}
                  round={true}
                  size="28"
                />
              ))}
            {!!folder.shared_groups &&
              folder.shared_groups.map((group) => (
                <Avatar
                  key={group.sync_id}
                  className="avatar-shared"
                  name={group.name}
                  src={groupIcon}
                  round={true}
                  size="28"
                />
              ))}
          </span>
        );
      }
      if (folder.welcome)
        return <span>This folder is visible to all users</span>;

      return folder.editable ? (
        <span>This folder can be shared with more users</span>
      ) : (
        <span>Folder can not be shared</span>
      );
    },
    [idRoom]
  );

  useEffect(() => {
    setLoading(true);
    let url = "";
    if (idOrganization && idGroup && idRoom) {
      url = `${baseNavigationPath}/folders`;
    } else {
      url = "/me/digitalassets";
    }

    api
      .get(url)
      .then((response) => {
        if (idRoom) {
          setAssets({
            filteredMy: [],
            my: [],
            filteredPublic: [],
            public: [],
          });
          setFolders(
            response.data.map((folder: any) => ({ ...folder, shared: true }))
          );
        } else {
          const _myassets = response.data.myassets
            ?.map((asset: any) => ({
              ...asset,
              created_at: format(parseISO(asset.created_at), "M/d/yyyy h:mm a"),
            }))
            .filter((asset: any) => asset.room_id === null);
          const _publicassets = response.data.publicassets
            ?.map((asset: any) => ({
              ...asset,
              created_at: format(parseISO(asset.created_at), "M/d/yyyy h:mm a"),
            }))
            .filter((asset: any) => asset.room_id === null);

          const _folders = response.data.folders
            .map((folder: any) => ({
              ...folder,
              shared: !!(
                (!!folder.shared_users &&
                  folder.owner.sync_id !== user.sync_id &&
                  folder.shared_users.length > 1) ||
                (!!folder.shared_groups && folder.shared_groups.length > 0)
              ),
            }))
            .filter((folder: any) => folder.room_id === null);

          setAssets({
            filteredMy: _myassets,
            my: _myassets,
            filteredPublic: _publicassets,
            public: _publicassets,
          });
          setFolders(_folders);
        }
      })
      .catch((err) => {
        console.log(err);
        addToast({
          title: "Error",
          type: "error",
          timeout: 3000,
          description: err.message,
        });
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => {
    setAssets({
      ...assets,
      filteredPublic:
        filter.length > 0
          ? assets.public.filter((f) => filter.includes(f.mimetype))
          : assets.public,
      filteredMy:
        filter.length > 0
          ? assets.my.filter((f) => filter.includes(f.mimetype))
          : assets.my,
    });
  }, [filter]);

  useEffect(() => {
    if (order) {
      setAssets({
        ...assets,
        filteredPublic: assets.filteredPublic.sort((a, b) =>
          order === "A-Z"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        ),
        filteredMy: assets.filteredMy.sort((a, b) =>
          order === "A-Z"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        ),
      });
    }
  }, [order]);

  useEffect(() => {
    if (orderDate) {
      setAssets({
        ...assets,
        filteredPublic: assets.filteredPublic.sort((a, b) =>
          orderDate === "Newest"
            ? new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            : new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
        ),
        filteredMy: assets.filteredMy.sort((a, b) =>
          orderDate === "Newest"
            ? new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            : new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
        ),
      });
    }
  }, [orderDate]);

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle="Digital Assets"
            goTo={
              location.state?.oldPage
                ? location.state.oldPage
                : `${baseNavigationPath}/dashboard`
            }
          />
          <h1>Digital Assets</h1>
        </div>
      </header>
      <Content>
        <Schedule>
          {loading && <ListItemLoader />}
          {!loading &&
            folders.map((folder) => (
              <FolderList
                key={folder.id}
                type={
                  folder.welcome
                    ? "welcome"
                    : folder.shared
                    ? "shared"
                    : "private"
                }
                onClick={() =>
                  handleGoTo(
                    `${baseNavigationPath}/folder/${folder.sync_id}/preview`
                  )
                }
                status={
                  folder.welcome
                    ? "welcome"
                    : folder.shared
                    ? "shared"
                    : "private"
                }
              >
                <div>
                  <AiFillFolderOpen size={36} />
                  <section>
                    <h4>
                      {folder.name} {folder.shared}
                    </h4>
                    {renderSharedFolder(folder)}
                  </section>

                  <Flag
                    color={
                      folder.welcome ? "blue" : folder.shared ? "green" : "red"
                    }
                  >
                    <strong>
                      {folder.welcome
                        ? "welcome"
                        : folder.shared
                        ? "shared"
                        : "private"}
                    </strong>
                  </Flag>
                </div>
              </FolderList>
            ))}

          <MyAssets>
            <h3>Filters</h3>
            <FilterList className="filter-content">
              {items.map((item) => (
                <Item
                  key={item}
                  name={item}
                  filter={filter}
                  handleFilter={setFilter}
                />
              ))}
            </FilterList>

            <h3>Order by: {"  "}</h3>
            <div>
              <FilterList className="filter-content">
                {orderAlphabetically.map((orderItem) => (
                  <Item
                    key={orderItem}
                    name={orderItem}
                    filter={order}
                    handleFilter={setOrder}
                  />
                ))}
                {orderByDate.map((orderData) => (
                  <Item
                    key={orderData}
                    name={orderData}
                    filter={orderDate}
                    handleFilter={setOrderDate}
                  />
                ))}
              </FilterList>
            </div>

            {!idRoom && (
              <>
                <h1>My Digital Assets</h1>
                {loading && <ListItemLoader />}
                {!loading && assets.filteredMy.length === 0 && (
                  <p>You don't have assets</p>
                )}

                <AnimatePresence>
                  {!loading &&
                    assets.filteredMy.map((asset) => (
                      <ContentDigitalAssets key={asset.sync_id}>
                        <div>
                          <Asset
                            url={asset.asset_url}
                            name={asset.name}
                            type={asset.mimetype}
                            onClick={() =>
                              handleGoTo(
                                `${baseNavigationPath}/digitalassets/${asset.sync_id}/preview`
                              )
                            }
                          />
                          <InfoDigitalAssets
                            onClick={() =>
                              handleGoTo(
                                `${baseNavigationPath}/digitalassets/${asset.sync_id}/preview`
                              )
                            }
                          >
                            <h4>{asset.name}</h4>
                            <strong>{asset.created_at}</strong>
                          </InfoDigitalAssets>

                          <section
                            onClick={() =>
                              handleGoTo(
                                `${baseNavigationPath}/digitalassets/${asset.sync_id}/preview`
                              )
                            }
                          >
                            <Flag
                              color={
                                asset.privacy === "public" ? "green" : "red"
                              }
                            >
                              <strong>{asset.privacy}</strong>
                            </Flag>

                            <FolderAsset>
                              {asset.folder && (
                                <>
                                  <AiFillFolder size={12} />
                                  {asset.folder.name}
                                </>
                              )}
                            </FolderAsset>
                          </section>

                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              handleGoTo(
                                `${baseNavigationPath}/digitalassets/${asset.sync_id}/edit`
                              );
                            }}
                          >
                            <FiEdit />
                          </button>
                        </div>
                      </ContentDigitalAssets>
                    ))}
                </AnimatePresence>
              </>
            )}
          </MyAssets>
        </Schedule>
        <RigthSection>
          <section>
            <BigButton
              onClick={() => handleGoTo(`${baseNavigationPath}/folder`)}
            >
              <FiPlus /> New Folder
            </BigButton>
            <BigButton
              onClick={() =>
                handleGoTo(`${baseNavigationPath}/digitalassets/new`)
              }
            >
              <FiUpload /> Upload Assets
            </BigButton>
          </section>

          <h3>Filters</h3>
          <FilterList>
            {items.map((item) => (
              <Item
                key={item}
                name={item}
                filter={filter}
                handleFilter={setFilter}
              />
            ))}
          </FilterList>

          <h1>Order by alphabetically:</h1>
          <FilterList>
            {orderAlphabetically.map((orderItem) => (
              <Item
                key={orderItem}
                name={orderItem}
                filter={order}
                handleFilter={setOrder}
              />
            ))}
          </FilterList>

          <h1>Order by upload date:</h1>
          <FilterList>
            {orderByDate.map((orderData) => (
              <Item
                key={orderData}
                name={orderData}
                filter={orderDate}
                handleFilter={setOrderDate}
              />
            ))}
          </FilterList>
        </RigthSection>
      </Content>

      <Footer>
        <Button
          color="accent"
          onClick={() => handleGoTo(`${baseNavigationPath}/folder`)}
        >
          <FiPlus /> New Folder
        </Button>
        <Button
          color="accent"
          onClick={() => handleGoTo(`${baseNavigationPath}/digitalassets/new`)}
        >
          <FiUpload /> Upload Assets
        </Button>
      </Footer>
    </Container>
  );
};

export default DigitalAssets;
