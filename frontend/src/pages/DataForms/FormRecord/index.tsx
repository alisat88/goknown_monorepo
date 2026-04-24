import MaterialTable from "material-table";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";

import ButtonBack from "../../../components/ButtonBack";
import Field from "../../../components/Field";
import { useDialog } from "../../../hooks/dialog";
import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import { Container, Content } from "./styles";

interface IColumnsItem {
  title: string;
  field: string;
}

interface IDataItem {
  [key: string]: string;
}

interface IDataForm {
  sync_id: string;
  id: string;
  name: string;
}

interface IDataFormItem {
  dataform: IDataForm;
  columns: IColumnsItem[];
  data: IDataItem[];
}

interface ILocationsProps {
  oldPage?: string;
}

export default function FormCollect() {
  const [record, setRecord] = useState({} as IDataFormItem);
  const [loading, setLoading] = useState(true);

  // hooks
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
  const location = useLocation<ILocationsProps>();

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }
    return "";
  }, [idGroup, idOrganization, idRoom]);
  // http://localhost:3000/organizations/3c5bf29b-96fb-536a-9e58-9e3bc56b4573/groups/210fd6a7-f416-508a-ac8e-5f32031fc4f3/rooms/0779aa70-1322-5f91-ad2b-7209d8d95c7e/dataforms/200435ad-6725-56d5-b747-a76745c92037/structure
  // http://localhost:3000/organizations/3c5bf29b-96fb-536a-9e58-9e3bc56b4573/groups/210fd6a7-f416-508a-ac8e-5f32031fc4f3/rooms/0779aa70-1322-5f91-ad2b-7209d8d95c7e/dataforms/a58516df-7a37-569f-9907-ea74b0dba04e/structure
  // http://localhost:3000/organizations/3c5bf29b-96fb-536a-9e58-9e3bc56b4573/groups/210fd6a7-f416-508a-ac8e-5f32031fc4f3/rooms/0779aa70-1322-5f91-ad2b-7209d8d95c7e/dataforms/200435ad-6725-56d5-b747-a76745c92037/structure
  useEffect(() => {
    api
      .get(`/me/dataforms/${dataFormId}/records`)
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
        console.log(response.data);
        setRecord(response.data);
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, [baseNavigationPath, dataFormId, history, showDialog]);

  return (
    <Container mobileHeight={90}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={record?.dataform?.name}
            goTo={
              location.state.oldPage
                ? location.state.oldPage
                : `/dataforms/${dataFormId}/edit`
            }
          />
          <Field
            loading={loading}
            tag="h1"
            value={record?.dataform?.name}
            width={300}
            height={50}
          />
        </div>
      </header>
      <Content>
        <MaterialTable
          isLoading={loading}
          title={`${record?.dataform?.name} Details`}
          data={record.data}
          columns={record.columns}
          options={{
            search: true,
            paging: false,
            filtering: false,
            exportButton: true,
          }}
        />
      </Content>
    </Container>
  );
}
