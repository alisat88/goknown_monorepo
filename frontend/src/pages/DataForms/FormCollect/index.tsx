import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import Button from "../../../components/Button";
import ButtonBack from "../../../components/ButtonBack";
import Checkbox from "../../../components/Checkbox";
import DatePicker from "../../../components/DatePicker";
import Field from "../../../components/Field";
import Input from "../../../components/Input";
import Radio from "../../../components/Radio";
import TextArea from "../../../components/TextArea";
import Toggle from "../../../components/Toggle";
import { useDialog } from "../../../hooks/dialog";
import { useToast } from "../../../hooks/toast";
import getValidationErrors from "../../../utils/getValidationErrors";
import { IComponentsProps } from "../components";
import { Container, Content } from "./styles";
import api from "../../../services/api";

import { IDataFormsItem } from "..";

interface ILocationsProps {
  oldPage?: string;
}

export default function FormCollect() {
  const [components, setComponents] = useState([] as IComponentsProps[]);
  const [dataForm, setDataForm] = useState({} as IDataFormsItem);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation<ILocationsProps>();

  // hooks
  const formRef = useRef<FormHandles>(null);
  const {
    id: dataFormId,
    idRoom,
    idGroup,
    idOrganization,
  } = useParams<{
    id: string;
    idRoom: string;
    idGroup: string;
    idOrganization: string;
  }>();
  const { addToast } = useToast();
  const history = useHistory();
  const { showDialog } = useDialog();

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }
    return "";
  }, [idGroup, idOrganization, idRoom]);

  const handleSubmit = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);
      try {
        formRef.current?.setErrors({});

        const objs = components
          .filter((component) => component.required === true)
          .reduce((obj, component) => {
            return {
              ...obj,
              [component.name || ""]: Yup.string().required("Required field"),
            };
          }, {});

        const schema = Yup.object().shape(objs);
        await schema.validate(data, { abortEarly: false });

        const value_json = JSON.stringify(data);

        api.post(`me/dataforms/${dataFormId}/records`, { value_json });

        addToast({ type: "success", title: "Record has been created" });

        history.push(`/dataforms/${dataFormId}/edit`);
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Create Record error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, components, dataFormId, history]
  );

  const renderComponent = useCallback((data: IComponentsProps) => {
    switch (data.component) {
      case "title":
        return <h3>{data.label}</h3>;
      case "description":
        return <p>{data.label}</p>;
      case "breakline":
        return <br />;
      case "text":
        return (
          <Input
            type={data.type}
            name={data.name || ""}
            placeholder={data.placeholder}
            label={data.label}
            // required={data.required}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            name={data.name || ""}
            placeholder={data.placeholder}
            label={data.label}
            // required={data.required}
          />
        );

      case "textarea":
        return (
          <TextArea
            name={data.name || ""}
            placeholder={data.placeholder}
            label={data.label}
          />
        );
      case "date":
        return (
          <DatePicker
            label={data.label}
            placeholderText={data.placeholder}
            name={data.name || ""}
            disabled={false}
          />
        );

      case "radio":
        return (
          <Radio
            direction="column"
            label={data.label}
            name={data.name || ""}
            options={data.options || []}
          />
        );
      case "checkbox":
        return (
          <Checkbox
            columns="1fr 1fr 1fr"
            label={data.label}
            name={data.name || ""}
            options={data.options || []}
          />
        );
      case "toggle":
        return (
          <Toggle
            active={data.switch_alias?.active}
            inactive={data.switch_alias?.inactive}
            showAlias={data.showAlias}
            label={data.label}
            name={data.name || ""}
          />
        );
      default:
        return <></>;
    }
  }, []);

  useEffect(() => {
    api
      .get(`/me/dataforms/${dataFormId}/structures`)
      .then((response) => {
        if (response.status === 204) {
          return showDialog({
            icon: "info",
            title: "Information",
            text: `
            The form structure was not finalized`,
            confirmButtonText: "Create now!",

            confirm: {
              function: async () => {},
              showLoaderOnConfirm: false,
              successMessage: "you will be redirected to form structure page",
              timeoutToClose: 1500,
            },
            redirectTo: `${baseNavigationPath}/dataforms/${dataFormId}/structure`,
            timeout: 0,
            showCancelButton: false,
          });
        }
        setComponents(JSON.parse(response.data.value_json));
        setDataForm(response.data.dataform);
        console.log(JSON.parse(response.data.value_json));
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, [baseNavigationPath, dataFormId, history, showDialog]);

  return (
    <Container mobileHeight={90} height={150}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={dataForm?.name}
            goTo={
              location.state.oldPage
                ? location.state.oldPage
                : `/dataforms/${dataFormId}/edit`
            }
          />
          <Field
            loading={loading}
            tag="h1"
            value={dataForm?.name}
            width={300}
            height={50}
          />
        </div>
      </header>
      <Content>
        {!loading && (
          <Form ref={formRef} onSubmit={handleSubmit}>
            {components.map((data) => (
              <React.Fragment key={data.id}>
                {renderComponent(data)}
              </React.Fragment>
            ))}
            <footer>
              <Button type="submit" isLoading={loadingSubmit}>
                SAVE
              </Button>
            </footer>
          </Form>
        )}
      </Content>
    </Container>
  );
}
