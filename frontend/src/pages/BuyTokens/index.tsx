// eslint-disable-next-line import/no-duplicates
import { format, parseISO, formatDistanceToNow } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import { enUS } from "date-fns/locale";
import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  InputHTMLAttributes,
} from "react";
import { FaRegCreditCard, FaAmazonPay, FaPaypal } from "react-icons/fa";
import { FiDollarSign } from "react-icons/fi";
import { useHistory, useParams } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { ReactComponent as Suffix } from "../../assets/suffix.svg";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import { LoaderCarduser } from "../../components/ContentLoader";
import CountUp from "../../components/CountUp";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import { useDialog } from "../../hooks/dialog";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
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
  CardMethod,
  LastCharges,
  Flag,
} from "./styles";

interface IChargeItem {
  id: string;
  method: "fake" | "card" | "paypal";
  process: "cancelled" | "completed" | "pending";
  amount: number;
  formattedAmount: string;
  date: any;
  created_at: string;
}

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

const BuyTokens: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { updateCurrentBalance, user } = useAuth();

  const [selectedDate, _] = useState(new Date());
  const [charges, setCharges] = useState<IChargeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [displayNewTokens, setDisplayNewTokens] = useState(
    formatValue(user.current_balance)
  );
  const [selectedMothod, setSelectedMethod] = useState("fake");
  // const [addRecipient, setAddRecipient] = useState<IRecipientItem>();

  const formRef = useRef<FormHandles>(null);
  // const formRecipientRef = useRef<FormHandles>(null);
  const { idGroup, idOrganization, idRoom } = useParams<IParams>();

  const { addToast } = useToast();
  const { showDialog } = useDialog();
  const history = useHistory();

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

  const handleSubmit = useCallback(
    async (data: any, { reset }: any) => {
      try {
        setLoadingSubmit(true);

        if (selectedMothod !== "fake") {
          addToast({
            type: "error",
            title: "Error",
            description: "Only Token Issuer can submit",
            timeout: 8000,
          });
          setLoadingSubmit(false);
          return;
        }

        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          amount: Yup.number().min(1).max(9999).required(),
        });

        await schema.validate(data, { abortEarly: false });

        // const response = await api.post("/me/charges", {
        //   amount: data.amount,
        //   method: selectedMothod,
        // });
        // const charge = response.data as IChargeItem;

        // setCharges([
        //   {
        //     ...charge,
        //     date: formatDistanceToNow(parseISO(charge.created_at)),
        //     formattedAmount: formatValue(charge.amount),
        //   },
        //   ...charges,
        // ]);

        // updateCurrentBalance(data.amount, true);
        // reset();
        // setDisplayNewTokens(user.current_balance.toString());
        // addToast({
        //   type: "success",
        //   title: "Buy tokens",
        //   description: "Amount added to your account",
        // });

        const url = idOrganization
          ? `/me/charges/organizations/${idOrganization}`
          : `/me/charges/`;

        showDialog({
          icon: "question",
          title: "Buy Token",
          text: `You are about to purchase ${formatValue(
            data.amount
          )}, do you want to proceed?`,
          confirmButtonText: "Yes, buy it!",
          cancelButtonText: "No",
          confirm: {
            function: () =>
              api
                .post(url, {
                  amount: data.amount,
                  method: selectedMothod,
                })
                .then((response) => {
                  const charge = response.data as IChargeItem;

                  setCharges([
                    {
                      ...charge,
                      date: formatDistanceToNow(parseISO(charge.created_at)),
                      formattedAmount: formatValue(charge.amount),
                    },
                    ...charges,
                  ]);

                  updateCurrentBalance(data.amount, true);
                  reset();
                  setDisplayNewTokens(user.current_balance.toString());
                  setTimeout(
                    () => history.push(`${baseNavigationPath}/trasactions`),
                    2800
                  );
                }),
            showLoaderOnConfirm: true,
            successMessage:
              "<b>successful transaction</b>, you will be redirected to the previous page",
            timeoutToClose: 4000,
          },
        });
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Buy tokens error",
          description: err.response.data.message,
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [
      addToast,
      charges,
      selectedMothod,
      updateCurrentBalance,
      user.current_balance,
      idOrganization,
    ]
  );

  const handleNewTotal = useCallback(
    (value: any) =>
      setDisplayNewTokens(
        formatValue(Number(user.current_balance) + Number(value))
      ),
    [user.current_balance]
  );

  useEffect(() => {
    const url = idOrganization
      ? `/me/charges/organizations/${idOrganization}`
      : `/me/charges/`;

    setLoading(true);
    api
      .get<IChargeItem[]>(url)
      .then((response) => {
        const lastet = response.data.map((charge) => ({
          ...charge,
          date: formatDistanceToNow(parseISO(charge.created_at)),
          formattedAmount: formatValue(charge.amount),
        }));
        setCharges(lastet);
      })
      .catch((err) =>
        addToast({ type: "error", title: "Error", description: err.message })
      )
      .finally(() => setLoading(false));
  }, [addToast, idOrganization]);

  return (
    <Container>
      <Header>
        <HeaderContent>
          {/* <ButtonBack mobileTitle="Issue Tokens" goTo="/trasactions" /> */}

          <ButtonBack
            mobileTitle="Issue Tokens"
            goTo={`${baseNavigationPath}/trasactions`}
          />
        </HeaderContent>
      </Header>
      <SubHeader />
      <Content>
        <Schedule>
          <h1>Buy Tokens</h1>
          <p>
            <span>{selectedDateAsText || ""}</span>
            <span>{selectedWeekDay || ""}</span>
          </p>
          <Section>
            <header>
              <h3>Choose payment method below</h3>
            </header>

            <div>
              <CardMethod
                onClick={() => setSelectedMethod("fake")}
                selected={selectedMothod === "fake"}
              >
                <FaRegCreditCard />
                <p>Token Issuer</p>
              </CardMethod>
              <CardMethod
                onClick={() => setSelectedMethod("amazon")}
                selected={selectedMothod === "amazon"}
              >
                <FaAmazonPay />
                <p>Amazon Pay</p>
              </CardMethod>
              <CardMethod
                onClick={() => setSelectedMethod("paypal")}
                selected={selectedMothod === "paypal"}
              >
                <FaPaypal />
                <p>PayPal</p>
              </CardMethod>
            </div>
          </Section>

          <Section>
            <header>
              <h3>How much do you want</h3>
            </header>

            <Form ref={formRef} onSubmit={handleSubmit}>
              <Input
                name="amount"
                placeholder="Amount"
                icon={Suffix}
                isLoading={loadingSubmit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleNewTotal(e.target.value)
                }
              />
              <Input
                name="newtotal"
                placeholder="Amount"
                value={`New Total: ${displayNewTokens}`}
                disabled
                isLoading
                icon={Suffix}
              />

              <Button type="submit" isLoading={loadingSubmit}>
                Buy
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
                <CountUp value={Number(user.current_balance)} />
              </h1>
            </div>
          </CardBalance>

          <LastCharges>
            <header>
              <h5>Latest Charges</h5>
            </header>

            <ul>
              {charges.map((charge) => (
                <li key={charge.id}>
                  <FaRegCreditCard />
                  <div>
                    <p>New tokens: {charge.formattedAmount}</p>
                    <strong>{charge.date}</strong>
                  </div>
                  <Flag type={charge.process}>{charge.process}</Flag>
                </li>
              ))}

              {/* <li>
                <FaAmazonPay />
                <div>
                  <p>New tokens: $ 100</p>
                  <strong>1 hour ago</strong>
                </div>
                <Flag type="cancelled">cancelled</Flag>
              </li>

              <li>
                <FaRegCreditCard />
                <div>
                  <p>New tokens: $ 200</p>
                  <strong>10 minutes ago</strong>
                </div>
                <Flag type="completed">completed</Flag>
              </li> */}
            </ul>
          </LastCharges>
        </Calendar>
      </Content>
    </Container>
  );
};

export default BuyTokens;
