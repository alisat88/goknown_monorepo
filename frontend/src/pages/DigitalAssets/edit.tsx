import { format, parseISO } from "date-fns";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { FiDatabase, FiFileText, FiFolder } from "react-icons/fi";
import { useHistory, useLocation, useParams } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { AssetTypes } from "../../components/Asset";
import AsyncSelect from "../../components/AsyncSelect";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import Input from "../../components/Input";
import TextArea from "../../components/TextArea";
import Toggle from "../../components/Toggle";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";
import { Container, ToggleContent, ContentForm } from "./styles";

interface IDigitalAssetsItem {
  id: string;
  src: string;
  type: AssetTypes;
  name: string;
  description?: string;
  folder?: IFoldersItem;
  privacy: "private" | "public";
  created_at: string;
}

interface IFoldersItem {
  id: string;
  sync_id: string;
  name: string;
}

interface ILocationsProps {
  oldPage?: string;
}

interface IParams {
  id: string;
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

const DigitalAssetsEdit: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [digitalAsset, setDigitalAsset] = useState<IDigitalAssetsItem>(
    {} as IDigitalAssetsItem
  );
  const history = useHistory();
  const [asyncLoading, setAsyncLoading] = useState(false);
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();

  const location = useLocation<ILocationsProps>();
  const { idGroup, idOrganization, idRoom, id } = useParams<IParams>();

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
        const schema = Yup.object().shape({
          description: Yup.string(),
          privacy: Yup.boolean().required(),
          folder: Yup.string().required(),
        });

        await schema.validate(data, { abortEarly: false });
        console.log(data);
        await api.put(`/me/digitalassets/${id}`, {
          description: data.description,
          privacy: data.privacy ? "private" : "public",
          folder_sync_id: data.folder,
        });

        addToast({
          title: "Success",
          type: "success",
          description: "Your asset has been update successfully",
        });
        history.goBack();
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
        setLoading(false);
      }
    },
    [addToast, history]
  );

  useEffect(() => {
    setLoading(true);
    api
      .get<IDigitalAssetsItem>(`/me/digitalassets/${id}`)
      .then((response) => {
        setIsOn(response.data.privacy === "private");
        formRef.current?.setData({
          name: response.data.name,
          description: response.data.description,
          folder: {
            value: response.data.folder?.sync_id,
            label: response.data.folder?.name,
          },
        });
        setDigitalAsset({
          ...response.data,
          //  type: mime.getExtension(response.data.mimetype || ""),
          created_at: format(
            parseISO(response.data.created_at),
            "M/d/yyyy h:mm a"
          ),
        });
      })
      .catch(
        (err) => console.log(err)
        // addToast({
        //   title: "Error",
        //   type: "error",
        //   timeout: 3000,
        //   description: err.message,
        // })
      )
      .finally(() => setLoading(false));
  }, [addToast, id]);

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

        // setAsyncLoading(true);
        const response = await api.get<IFoldersItem[]>(url, {
          params: { name: value },
        });
        setAsyncLoading(false);
        return response.data.map((folder) => ({
          value: folder.sync_id,
          label: `${folder.name}`,
        }));
      } catch (err: any) {
        // setAsyncLoading(false);
        console.log(err);
      }
      // }
    },
    [baseNavigationPath, idGroup, idOrganization, idRoom]
  );

  return (
    <Container height={170} mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={`Edit ${digitalAsset.name}`}
            goTo={`${baseNavigationPath}/digitalassets/${id}/preview`}
          />
          <h1>Edit {digitalAsset.name}</h1>
        </div>
      </header>

      <ContentForm>
        <Form initialData={digitalAsset} ref={formRef} onSubmit={handleSubmit}>
          <Input
            name="name"
            icon={FiDatabase}
            placeholder="Name"
            isDisabled={true}
            isLoading={loading}
          />

          <TextArea
            name="description"
            icon={FiFileText}
            placeholder="Assets Description"
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
            <Toggle name="privacy" isOn={isOn} onClick={() => setIsOn(!isOn)} />
          </ToggleContent>

          <Button type="submit" color="accent" isLoading={loading}>
            SAVE ASSET
          </Button>
        </Form>
      </ContentForm>
    </Container>
  );
};

export default DigitalAssetsEdit;
