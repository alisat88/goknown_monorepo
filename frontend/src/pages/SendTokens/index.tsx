// eslint-disable-next-line import/no-duplicates
import { format } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import { enUS } from "date-fns/locale";
import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { FiMessageCircle } from "react-icons/fi";
import { ImQrcode } from "react-icons/im";
import { useHistory, useParams } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { ReactComponent as Suffix } from "../../assets/suffix.svg";
import AsyncSelect from "../../components/AsyncSelect";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import ButtonTransform from "../../components/ButtonTransform";
import { LoaderCarduser } from "../../components/ContentLoader";
import CountUp from "../../components/CountUp";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import { useDialog } from "../../hooks/dialog";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Avatar } from "../../styles/global";
import formatValue from "../../utils/formatValue";
import getValidationErrors from "../../utils/getValidationErrors";
import {
  Container,
  Header,
  HeaderContent,
  Content,
  Schedule,
  Calendar,
  Section,
  SubHeader,
  CardBalance,
  CardUser,
  CardContent,
} from "./styles";

interface IRecipientItem {
  id: string;
  sync_id: string;
  name: string;
  email?: string;
  value?: string;
  label?: string;
  avatar?: string;
  avatar_url?: string;
  firstName?: string;
}

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

const SendTokens: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [recipients, setRecipients] = useState<IRecipientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [asynctLoading, setAsyncLoading] = useState(false);
  const [addUserMenuOpen, setAddUserMenuOpen] = useState(false);
  const [addRecipient, setAddRecipient] = useState<IRecipientItem>();
  const [selectedRecipient, setSelectedRecipient] = useState<IRecipientItem>();

  const formRef = useRef<FormHandles>(null);
  const formRecipientRef = useRef<FormHandles>(null);

  const { updateCurrentBalance, user } = useAuth();
  const { addToast } = useToast();
  const { showDialog, hideDialog } = useDialog();
  const history = useHistory();

  const { idGroup, idOrganization, idRoom } = useParams<IParams>();

  // nunca criar variaveis ou manipular valores como uma variavel normal
  // para calculos usar useMemo

  const selectedDateAsText = useMemo(() => {
    return format(selectedDate, "MMMM',' dd',' y", {
      locale: enUS,
    });
  }, [selectedDate]);

  const selectedWeekDay = useMemo(
    () => format(selectedDate, "cccc", { locale: enUS }),
    [selectedDate]
  );

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }

    return "";
  }, [idGroup, idOrganization, idRoom]);

  const loadUsers = useCallback(
    async (value: any) => {
      if (value.length > 2) {
        try {
          // setAsyncLoading(true);
          if (idOrganization && idGroup && idRoom) {
            const response = await api.get(
              `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`
            );

            return response.data.members.map((roomUser: any) => ({
              value: roomUser.user.sync_id,
              label: roomUser.user.name,
              firstName: roomUser.user.name.split(" ")[0],
              ...roomUser.user,
            }));
          }
          const response = await api.get<IRecipientItem[]>("/users", {
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
    },
    [idGroup, idOrganization, idRoom]
  );

  const handleAddRecipientSubmit = useCallback(
    async (setExpand: any) => {
      setLoadingSubmit(true);
      try {
        const url = idOrganization
          ? `/me/recipients/organizations/${idOrganization}`
          : `/me/recipients/`;

        if (addRecipient) {
          await api.post("/me/recipients/", {
            recipient_id: addRecipient?.sync_id,
          });
          setRecipients([
            ...recipients,
            {
              value: addRecipient.sync_id,
              label: addRecipient.name,
              firstName: addRecipient.name.split(" ")[0],
              ...addRecipient,
            },
          ]);
          setAddRecipient(undefined);
          setExpand(false);
          setAddUserMenuOpen(false);
          addToast({
            type: "success",
            title: "User added",
            description: `success to added ${addRecipient.name} on recipient list`,
          });
        }
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Error",
          description: err.response.data.error,
          timeout: 8000,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addRecipient, addToast, recipients]
  );

  const handleSubmit = useCallback(
    async (data: any, { reset }: any) => {
      setLoadingSubmit(true);
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          amount: Yup.number().min(1).max(9999).required(),
          recipient: Yup.string().required(),
        });

        await schema.validate(data, { abortEarly: false });
        const { amount, recipient: to_user_id, message } = data;
        // await api.post("/me/transactions", { amount, to_user_id, message });

        const url = idOrganization
          ? `/me/transactions/organizations/${idOrganization}`
          : `/me/transactions/`;
        showDialog({
          icon: "question",
          title: "Send Token",
          text: `You are about to send ${formatValue(
            data.amount
          )} to the user ${selectedRecipient?.name}, do you want to continue?`,
          confirmButtonText: "Yes, send it!",
          cancelButtonText: "No",
          confirm: {
            function: () =>
              api
                .post(url, {
                  amount,
                  to_user_id,
                  message,
                })
                .then((response) => {
                  reset();

                  setTimeout(
                    () => history.push(`${baseNavigationPath}/trasactions`),
                    2800
                  );
                })
                .catch((error) => {
                  // hideDialog();
                  console.log(error.response.data.error);
                  addToast({
                    type: "error",
                    title: "Send tokens error",
                    timeout: 8000,
                    description: error.response
                      ? error.response.data.error
                      : error.message,
                  });
                  // showDialog({
                  //   icon: "error",
                  //   title: "Insufficient funds",
                  //   text: error.response.data.error || "Error",
                  // });
                }),
            showLoaderOnConfirm: true,
            successIcon: "info",
            errorIcon: "info",
            successMessage:
              "<b> Your submission is being processed</b>, you will be redirected shortly.",
            errorMessage:
              "<b> Your submission is being processed</b>, you will be redirected shortly.",
            timeoutToClose: 3000,
          },
        });

        // reset();
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Send tokens error",
          timeout: 8000,
          description: err.response ? err.response.data.error : err.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, selectedRecipient?.name, showDialog, updateCurrentBalance]
  );

  const handleSelectedRecipient = useCallback((recipient: any) => {
    if (formRef.current) {
      formRef.current.setFieldValue("recipient", recipient);
      // Set all data
      console.log("recipient=====>", recipient);
      setSelectedRecipient(recipient);
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    // const url = idOrganization
    //   ? `/me/recipients/organizations/${idOrganization}`
    //   : `/me/recipients/`;

    api
      .get<IRecipientItem[]>("/me/recipients")
      .then((response) =>
        setRecipients(
          response.data.map((user) => ({
            value: user.sync_id,
            label: user.name,
            ...user,
            firstName: user.name.split(" ")[0],
          }))
        )
      )
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [idOrganization]);

  return (
    <Container>
      <Header>
        <HeaderContent>
          {/* <ButtonBack mobileTitle="Send Tokens" goTo="/trasactions" /> */}
          <ButtonBack
            mobileTitle="Send Tokens"
            goTo={`${baseNavigationPath}/trasactions`}
          />
        </HeaderContent>
      </Header>
      <SubHeader />
      <Content>
        <Schedule>
          <h1>Send Tokens</h1>
          <p>
            <span>{selectedDateAsText || ""}</span>
            <span>{selectedWeekDay || ""}</span>
          </p>
          {!idOrganization && (
            <Section>
              <header>
                <h3>My Recipients</h3>
                <button>
                  <ImQrcode />
                </button>
              </header>

              <div>
                <ButtonTransform
                  onChangePanel={setAddUserMenuOpen}
                  hasValueToSubmit={!!addRecipient}
                  isLoading={loadingSubmit}
                  onSubmit={(setExpand) => handleAddRecipientSubmit(setExpand)}
                >
                  <Form ref={formRecipientRef} onSubmit={() => {}}>
                    <AsyncSelect
                      name="recipient"
                      type="avatar"
                      onChange={(value: any) =>
                        value
                          ? setAddRecipient({
                              id: value.id,
                              sync_id: value.sync_id,
                              name: value.label,
                              firstName: value.firstName,
                            })
                          : setAddRecipient(undefined)
                      }
                      isClearable
                      isLoading={asynctLoading}
                      placeholder="Recipient"
                      loadOptions={loadUsers}
                    />
                  </Form>
                </ButtonTransform>

                {/* <button>
                <FiPlus />
              </button> */}

                {loading && <LoaderCarduser />}
                <CardContent>
                  {!loading &&
                    recipients.map((recipient) => (
                      <CardUser
                        key={recipient.id}
                        blurred={addUserMenuOpen}
                        selected={recipient.id === selectedRecipient?.id}
                        onClick={() => handleSelectedRecipient(recipient)}
                      >
                        <Avatar
                          name={recipient.name}
                          src={recipient.avatar_url}
                          width={46}
                          height={46}
                          round
                        />
                        <strong>{recipient.firstName}</strong>
                      </CardUser>
                    ))}
                </CardContent>
              </div>
            </Section>
          )}
          <Section>
            <header>
              <h3>How much do you want to transfer?</h3>
            </header>

            <Form ref={formRef} onSubmit={handleSubmit}>
              <AsyncSelect
                name="recipient"
                type="avatar"
                margin="0 0 18px 0"
                onChange={(value: any) =>
                  value
                    ? setSelectedRecipient({
                        id: value.id,
                        name: value.label,
                        firstName: value.firstName,
                        ...value,
                      })
                    : setSelectedRecipient(undefined)
                }
                isClearable
                value={selectedRecipient}
                isLoading={asynctLoading}
                placeholder="Recipient"
                loadOptions={loadUsers}
              />
              <Input
                name="amount"
                placeholder="Amount"
                icon={Suffix}
                isLoading={loadingSubmit}
              />
              <Input
                name="message"
                placeholder="Note"
                icon={FiMessageCircle}
                isLoading={loadingSubmit}
              />

              <Button type="submit" isLoading={loadingSubmit}>
                Send / Pay
              </Button>
            </Form>
          </Section>
        </Schedule>
        <Calendar>
          <CardBalance>
            <header>
              <h5>Current balance</h5>
              <Suffix style={{ fill: "#fff" }} />
            </header>

            <div>
              <h1>
                <CountUp value={user.current_balance} />
              </h1>
            </div>
          </CardBalance>
        </Calendar>
      </Content>
    </Container>
  );
};

export default SendTokens;
