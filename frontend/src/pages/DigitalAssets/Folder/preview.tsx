import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "react-avatar";
import { FiEdit, FiUpload } from "react-icons/fi";
import { useHistory, useLocation, useParams } from "react-router-dom";

import groupIcon from "../../../assets/group.svg";
import Asset, { AssetTypes, EnumAssetsType } from "../../../components/Asset";
import Button from "../../../components/Button";
import ButtonBack from "../../../components/ButtonBack";
import ListItemLoader from "../../../components/ContentLoader/LisItemLoader";
import Field from "../../../components/Field";
import { useAuth } from "../../../hooks/auth";
import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import { Footer } from "../../../styles/global";
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
} from "../styles";
import { MembersList } from "./styles";

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
  name: string;
  owner: IUserData;
  shared?: boolean;
  editable: boolean;
  shared_users?: IUserData[];
  shared_groups?: IGroupData[];
  assets?: IDigitalAssetsItem[];
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

interface IResponseDigitalAssets extends IFoldersItem {
  assets: IDigitalAssetsItem[];
}

interface IAssetsState {
  filteredMy: IDigitalAssetsItem[];
  my: IDigitalAssetsItem[];
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

const FolderPreview: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [folder, setFolder] = useState<IFoldersItem>();
  const { id: folderId } = useParams<{ id: string }>();
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
  const location = useLocation<ILocationsProps>();
  const { idGroup, idOrganization, idRoom } = useParams<IParams>();

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }
    return "";
  }, [idGroup, idOrganization, idRoom]);

  const { user } = useAuth();
  const handleGoTo = useCallback(
    (to: string, folder?: string) =>
      history.push(to, {
        folderId: folder,
        oldPage: `/folder/${folderId}/preview`,
      }),
    [folderId, history]
  );

  useEffect(() => {
    setLoading(true);
    api
      .get<IResponseDigitalAssets>(`/me/folders/${folderId}`)
      .then((response) => {
        const _folder = {
          ...response.data,
          shared: !!(
            (!!response.data.shared_users &&
              response.data.shared_users.length > 1) ||
            (!!response.data.shared_groups &&
              response.data.shared_groups.length > 0)
          ),
        };

        setAssets({
          filteredMy: response.data.assets,
          my: response.data.assets,
        });

        setFolder(_folder);
      })
      .catch((err) =>
        addToast({
          title: "Error",
          type: "error",
          timeout: 3000,
          description: err.message,
        })
      )
      .finally(() => setLoading(false));
  }, [addToast, folderId, user.id]);

  useEffect(() => {
    setAssets({
      ...assets,
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

  const renderMembersAndGroups = useCallback(() => {
    if (!folder) {
      return <></>;
    }
    if ((folder.shared_users || folder.shared_groups) && folder.shared) {
      return (
        <MembersList className="members-content">
          <h3>Members</h3>
          <section>
            {!!folder.shared_users &&
              folder.shared_users.map((user) => (
                <div key={user.sync_id}>
                  <Avatar
                    className="avatar-shared"
                    name={user.name}
                    src={user.avatar_url}
                    round={true}
                    size="42"
                  />
                  {folder.owner.sync_id === user.sync_id ? (
                    <strong>OWNER</strong>
                  ) : (
                    ""
                  )}
                </div>
              ))}
            {!!folder.shared_groups &&
              folder.shared_groups.map((group) => (
                <div
                  key={group.sync_id}
                  className="members-group"
                  onClick={() => handleGoTo(`/groups/${group.sync_id}/edit`)}
                >
                  <Avatar
                    className="avatar-shared"
                    name={group.name}
                    src={groupIcon}
                    round={true}
                    size="42"
                  />

                  <strong>GROUP</strong>
                </div>
              ))}
          </section>
        </MembersList>
      );
    }
    return (
      <MembersList className="members-content">
        <h3>Members</h3>
        <span>Folder can not be shared</span>
      </MembersList>
    );
  }, [folder]);

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={`Folder ${folder?.name}`}
            goTo={`${baseNavigationPath}/digitalassets`}
          />
          <h1>
            FOLDER:
            <Field
              loading={loading}
              value={folder?.name}
              width={200}
              height={30}
            />
          </h1>
        </div>
      </header>
      <Content>
        <Schedule>
          <MyAssets>
            {!idRoom && renderMembersAndGroups()}

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

            {loading && <ListItemLoader />}
            {!loading && assets.filteredMy.length === 0 && (
              <p>You don't have assets</p>
            )}

            <AnimatePresence>
              {!loading &&
                assets.filteredMy.map((asset) => (
                  <ContentDigitalAssets
                    key={asset.sync_id}
                    onClick={() =>
                      handleGoTo(
                        `${baseNavigationPath}/digitalassets/${asset.sync_id}/preview`
                      )
                    }
                  >
                    <div>
                      <Asset
                        url={asset.asset_url}
                        name={asset.name}
                        type={asset.mimetype}
                      />
                      <InfoDigitalAssets>
                        <h4>{asset.name}</h4>
                        <strong>{asset.created_at}</strong>
                      </InfoDigitalAssets>

                      <Flag
                        color={asset.privacy === "public" ? "green" : "red"}
                      >
                        <strong>{asset.privacy}</strong>
                      </Flag>
                    </div>
                  </ContentDigitalAssets>
                ))}
            </AnimatePresence>
          </MyAssets>
        </Schedule>
        <RigthSection>
          <section>
            <BigButton
              color="accent"
              onClick={() =>
                !folder?.editable
                  ? {}
                  : handleGoTo(`${baseNavigationPath}/folder/${folderId}/edit`)
              }
              disabled={!folder?.editable}
            >
              <FiEdit /> Edit Folder
            </BigButton>
            <BigButton
              onClick={() =>
                handleGoTo(`${baseNavigationPath}/digitalassets/new`, folderId)
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

          {!idRoom && renderMembersAndGroups()}
        </RigthSection>
      </Content>

      <Footer>
        <Button
          color="accent"
          onClick={() =>
            handleGoTo(`${baseNavigationPath}/folder/${folderId}/edit`)
          }
        >
          <FiEdit /> Edit Folder
        </Button>

        <Button
          color="accent"
          onClick={() =>
            handleGoTo(`${baseNavigationPath}/digitalassets/new`, folderId)
          }
        >
          <FiUpload /> Upload Assets
        </Button>
      </Footer>
    </Container>
  );
};

export default FolderPreview;
