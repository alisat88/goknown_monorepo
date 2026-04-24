import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { FiDatabase, FiFileText, FiFolder, FiPlus } from "react-icons/fi";
import { useHistory, useLocation, useParams } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { EnumAssetsType } from "../../components/Asset";
import AsyncSelect from "../../components/AsyncSelect";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import Input from "../../components/Input";
import InputFile from "../../components/InputFile";
import TextArea from "../../components/TextArea";
import Toggle from "../../components/Toggle";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";
import {
  Container,
  ToggleContent,
  ContentForm,
  ContentUpload,
  ProgressBar,
} from "./styles";

interface IFoldersItem {
  id: string;
  sync_id: string;
  name: string;
  room_id?: string;
}

const FILE_SIZE = 160 * 1024 * 1024;
const SUPPORTED_FORMATS = Object.keys(EnumAssetsType);

interface ILocationsProps {
  folderId?: string;
  oldPage?: string;
}

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

const DigitalAssetsPreview: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const history = useHistory();

  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();

  const location = useLocation<ILocationsProps>();
  const { idGroup, idOrganization, idRoom } = useParams<IParams>();

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }

    return "";
  }, [idGroup, idOrganization, idRoom]);

  const handleSubmit = useCallback(
    async (data: any, { reset }: any) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});

        const formData = new FormData();
        const schema = Yup.object().shape({
          name: Yup.string().required(),
          description: Yup.string(),
          privacy: Yup.boolean().required(),
          folder: Yup.string().required(),
          asset: Yup.mixed()

            .test(
              "fileSize",
              "File too large",
              (value) => value && value.size <= FILE_SIZE
            )
            .test(
              "fileFormat",
              "Unsupported Format",
              (value) => value && SUPPORTED_FORMATS.includes(value.type)
            )
            .required("A file is required"),
        });

        await schema.validate(data, { abortEarly: false });

        formData.append("file", data.asset);
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("privacy", data.privacy ? "private" : "public");
        formData.append("folder_sync_id", data.folder);
        // used '' to validate at the backend
        // eslint-disable-next-line prettier/prettier
        formData.append("room_syncid", idRoom || '');

        setUploading(true);
        await api.post("/me/digitalassets", formData, {
          // headers:{'Content-Type': 'multipart/form-data'},
          timeout: 30000,
          onUploadProgress(progressEvent) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setPercent(percentCompleted);
          },
        });

        addToast({
          title: "Success",
          type: "success",
          description: "Your asset has been uploaded successfully",
        });
        if (location.state.folderId) {
          history.push(
            `${baseNavigationPath}/folder/${location.state.folderId}/preview`
          );
        } else {
          history.push(`${baseNavigationPath}/digitalassets`);
        }
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);
          console.log(errors);
          formRef.current?.setErrors(errors);
          return;
        }
        addToast({
          title: "Error",
          type: "error",
          description: err.response.data.error,
        });
        console.log(err.response);
      } finally {
        setPercent(0);
        setUploading(false);
        setLoading(false);
      }
    },
    [addToast, baseNavigationPath, history, idRoom, location.state.folderId]
  );

  const loadFolders = useCallback(
    async (value: any) => {
      // if (value.length > 2) {
      try {
        let url = "";
        if (idOrganization && idGroup && idRoom) {
          url = `${baseNavigationPath}/folders`;
        } else {
          url = "/me/folders";
        }

        const response = await api.get<IFoldersItem[]>(url, {
          params: { name: value },
        });
        setAsyncLoading(false);
        return response.data
          .map((folder) => ({
            value: folder.sync_id,
            label: `${folder.name}`,
            room_id: folder.room_id,
          }))
          .filter((folder) => {
            if (idRoom) {
              return !!folder.room_id;
            }
            return !folder.room_id;
          });
      } catch (err: any) {
        // setAsyncLoading(false);
        console.log(err);
      }
      // }
    },
    [baseNavigationPath, idGroup, idOrganization, idRoom]
  );

  useEffect(() => {
    if (location.state.folderId) {
      api
        .get(`/me/folders/${location.state.folderId}`)
        .then((response) => {
          formRef.current?.setData({
            folder: {
              value: response.data.sync_id,
              label: response.data.name,
            },
          });
        })
        .catch((error) => console.log(error));
    }
  }, [location.state.folderId]);

  return (
    <Container height={170} mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle="New Digital Assets"
            goTo={
              location.state.folderId
                ? `${baseNavigationPath}/folder/${location.state.folderId}/preview`
                : `${baseNavigationPath}/digitalassets`
            }
          />
          <h1>New Digital Assets</h1>
        </div>
      </header>

      <ContentForm>
        {!uploading ? (
          <Form ref={formRef} onSubmit={handleSubmit}>
            <Input
              name="name"
              icon={FiDatabase}
              placeholder="Name"
              isLoading={loading}
            />

            <TextArea
              name="description"
              icon={FiFileText}
              placeholder="Assets Description"
              isLoading={loading}
            />

            <InputFile
              name="asset"
              icon={FiPlus}
              placeholder="CLICK TO SELECT ASSET"
              isLoading={loading}
            />

            <AsyncSelect
              type="normal"
              name="folder"
              placeholder="SELECT FOLDER"
              icon={FiFolder}
              searchable={false}
              loadOptions={loadFolders}
            />

            <ToggleContent>
              <strong>PRIVATE</strong>
              <Toggle
                name="privacy"
                isOn={isOn}
                onClick={() => setIsOn(!isOn)}
              />
            </ToggleContent>

            <Button type="submit" color="accent" isLoading={loading}>
              UPLOAD ASSET
            </Button>
          </Form>
        ) : (
          <ContentUpload>
            {/* <img src={Upload} alt="upload"/> */}
            <h4>{percent}%</h4>
            <p>Your file is being uploaded</p>
            <ProgressBar percent={percent} />
          </ContentUpload>
        )}
      </ContentForm>
    </Container>
  );
};

export default DigitalAssetsPreview;
