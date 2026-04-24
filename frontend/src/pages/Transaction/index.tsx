// eslint-disable-next-line import/no-duplicates
import { format, parseISO } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import { enUS } from "date-fns/locale";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiPower,
  FiDollarSign,
  FiSend,
  FiShoppingCart,
  FiUser,
} from "react-icons/fi";
import { useHistory, Link, useParams } from "react-router-dom";

import logoImg from "../../assets/logo-white.svg";
import noTransactions from "../../assets/notransactions.svg";
import { ReactComponent as Suffix } from "../../assets/suffix.svg";
import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import TransactionLoader from "../../components/ContentLoader/TransactionsLoader";
import CountUp from "../../components/CountUp";
import { useAuth } from "../../hooks/auth";
import { useDialog } from "../../hooks/dialog";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import { Avatar } from "../../styles/global";
import formatValue from "../../utils/formatValue";
import {
  Container,
  Header,
  HeaderContent,
  Profile,
  Content,
  Schedule,
  Calendar,
  Section,
  SubHeader,
  LatestTransaction,
  InfoTransaction,
  BalanceTransaction,
  CardBalance,
  SendToken,
  BuyToken,
  Footer,
  TransactionInfo,
  TransactionMessageInfo,
} from "./styles";

interface IUser {
  id: string;
  name: string;
  avatar: string;
  avatar_url: string;
  email: string;
}

interface ITransactionItem {
  id: string;
  category: "charge" | "transaction";
  transactionType: "sent" | "received";
  status: "pending" | "approved" | "unapproved" | "failed";
  amount: number;
  balance: number;
  formattedAmount: string;
  formattedBalance: string;
  created_at: string;
  message?: string;
  date: string;
  touser: IUser;
  fromuser: IUser;
}

interface IResponseTransactions {
  transactions: ITransactionItem[];
  current_balance: number;
}

interface IParams {
  idOrganization: string;
  idGroup: string;
  idRoom: string;
}

const Transaction: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ITransactionItem[]>([]);
  const history = useHistory();

  const { addToast } = useToast();
  const { showDialog } = useDialog();
  const { signOut, user, updateCurrentBalance } = useAuth();

  const { idGroup, idOrganization, idRoom } = useParams<IParams>();

  // never create variables or manupulate values as a normal variable
  // for calculations use useMemo

  const selectedDateAsText = useMemo(() => {
    return format(selectedDate, "MMMM',' dd',' y", {
      locale: enUS,
    });
  }, [selectedDate]);

  const selectedWeekDay = useMemo(
    () => format(selectedDate, "cccc", { locale: enUS }),
    [selectedDate]
  );

  const description = useCallback((transaction: ITransactionItem) => {
    if (transaction.transactionType === "sent") {
      return `to ${transaction.touser.name}`;
    }
    if (transaction.transactionType === "received") {
      if (transaction.category === "charge") {
        return "from Token Issuer";
      }
      return `from ${transaction.touser.name}`;
    }

    return "";
  }, []);

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }
    window.history.replaceState({}, document.title);
    return "";
  }, [idGroup, idOrganization, idRoom]);

  const formattedDateTransaction = useCallback(
    (date: string) => format(parseISO(date), "M/d/yyyy h:mm a"),
    []
  );

  const avatar = useCallback((transaction: ITransactionItem) => {
    if (transaction.transactionType === "sent") {
      return (
        <Avatar
          name={transaction.fromuser.name}
          src={transaction.fromuser.avatar_url}
          round
        />
      );
    }
    if (transaction.transactionType === "received") {
      if (transaction.category === "charge") {
        return "";
      }
      return (
        <Avatar
          name={transaction.touser.name}
          src={transaction.touser.avatar_url}
          round
        />
      );
    }
    return "";
  }, []);

  const handleGoTo = useCallback(
    (to: string) => history.push(`${baseNavigationPath}${to}`),
    [baseNavigationPath, history]
  );

  const transactionTemplate = useCallback(
    (transaction: ITransactionItem) => {
      return (
        <TransactionInfo>
          <ul>
            <li>
              <strong>Date:</strong>
              <p>{formattedDateTransaction(transaction.created_at)}</p>
            </li>
            <li>
              <strong>Transaction ID:</strong> <p>{transaction.id}</p>
            </li>
            {transaction.category === "transaction" && (
              <li>
                <strong>From:</strong> <p>{transaction.fromuser.name}</p>
              </li>
            )}
            <li>
              <strong>To:</strong> <p>{transaction.touser.name}</p>
            </li>
            <li>
              <strong>Amount:</strong> <p>{formatValue(transaction.amount)}</p>
            </li>
          </ul>
          {transaction.message && (
            <TransactionMessageInfo>
              <label>Note</label>
              <p>{transaction.message}</p>
            </TransactionMessageInfo>
          )}
        </TransactionInfo>
      );
    },

    []
  );

  const handleReceiptTransaction = useCallback(
    (transaction: ITransactionItem) => {
      showDialog({
        cancelButtonText: "Close",
        showCancelButton: true,
        showConfirmButton: false,
        title: `${transaction.category} info`,
        html: transactionTemplate(transaction),
      });
    },
    [showDialog, transactionTemplate]
  );

  useEffect(() => {
    setLoading(true);
    const url = idOrganization
      ? `/me/transactions/organizations/${idOrganization}`
      : `/me/transactions/`;

    api
      .get<IResponseTransactions>(url)
      .then((response) => {
        setTransactions(
          response.data.transactions.map((transaction) => ({
            ...transaction,
            date: format(parseISO(transaction.created_at), "MM/dd/yy"),
            formattedAmount: formatValue(transaction.amount),
            formattedBalance: formatValue(transaction.balance),
          }))
        );
        updateCurrentBalance(response.data.current_balance, false);
      })
      .catch((err) =>
        addToast({ type: "error", title: "error", description: err.message })
      )
      .finally(() => setLoading(false));
  }, [addToast, idOrganization, updateCurrentBalance]);

  useEffect(() => {
    if (
      transactions.length > 0 &&
      user.current_balance < transactions[0].balance
    ) {
      updateCurrentBalance(transactions[0].balance, false);
    }
  }, [transactions, updateCurrentBalance, user.current_balance]);

  return (
    <Container>
      <header>
        <div>
          {/* <ButtonBack mobileTitle="Transactions" goTo="/dashboard" /> */}
          <ButtonBack
            mobileTitle="Transactions"
            goTo={`${baseNavigationPath}/dashboard`}
          />
        </div>
      </header>
      <Content>
        <Schedule>
          <h1>Recent Transactions</h1>
          <p>
            <span>{selectedDateAsText || ""}</span>
            <span>{selectedWeekDay || ""}</span>
          </p>
          <Section>
            {loading && <TransactionLoader />}
            {!loading && transactions.length === 0 && (
              <header>
                <p>No Transactions found</p>
                <img src={noTransactions} alt="no transactions" />
              </header>
            )}
            {!loading &&
              transactions.map((transaction) => (
                <LatestTransaction
                  key={transaction.id}
                  type={transaction.transactionType}
                  onClick={() => handleReceiptTransaction(transaction)}
                  status={transaction.status}
                >
                  <span>
                    <FiCalendar /> {transaction.date}
                  </span>
                  <div>
                    {avatar(transaction)}
                    <section>
                      <InfoTransaction status={transaction.status}>
                        <span>
                          <h4>{transaction.transactionType}</h4>
                          <h6>
                            {["unapproved", "failed"].includes(
                              transaction.status
                            )
                              ? `- ${transaction.status}`
                              : ""}
                          </h6>
                        </span>
                        <strong>{description(transaction)}</strong>
                      </InfoTransaction>
                      <BalanceTransaction
                        status={transaction.status}
                        type={transaction.transactionType}
                      >
                        <div>
                          <Suffix />
                          <h2>{transaction.formattedAmount}</h2>
                        </div>
                        <strong>{transaction.formattedBalance}</strong>
                      </BalanceTransaction>
                    </section>
                  </div>
                </LatestTransaction>
              ))}
          </Section>
        </Schedule>
        <Calendar>
          <CardBalance>
            <header>
              <h5>Current balance</h5>
              <Suffix style={{ fill: "#fff" }} />
            </header>

            <div>
              <h1>{!loading && <CountUp value={user.current_balance} />}</h1>
            </div>
          </CardBalance>

          <section>
            <BuyToken onClick={() => handleGoTo("/buytokens")}>
              <FiShoppingCart />
              <p>Buy Token</p>
            </BuyToken>
            <SendToken onClick={() => handleGoTo("/sendtokens")}>
              <FiSend />
              <p>Send Token</p>
            </SendToken>
          </section>
        </Calendar>
      </Content>
      <Footer>
        {["admin", "buyer", "issuer"].includes(user.role)}
        <Button onClick={() => handleGoTo("/buytokens")}>Buy tokens</Button>
        <Button color="secondary" onClick={() => handleGoTo("/sendtokens")}>
          Send Tokens
        </Button>
      </Footer>
    </Container>
  );
};

export default Transaction;
