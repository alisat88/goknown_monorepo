import { shade } from "polished";
import styled, { css } from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div``;

export const Header = styled.header`
  padding: 32px 0;
  background: #000034;
`;

export const SubHeader = styled.header`
  height: 160px;
  background: #000034;
  border-radius: 0 0 0 100px;

  // mobile
  @media ${device.laptopL} {
    border-radius: 0 0 0 0;
  }

  @media ${device.laptopM} {
    height: 0px;
  }
`;

export const HeaderContent = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;

  // mobile
  @media ${device.laptopM} {
    margin: 0 auto;
    padding: 0 20px;
  }

  div.logo {
    flex-direction: column;
    p {
      color: #f2f2f2;
      font-size: 0.8rem;
      opacity: 0.8;
    }
    > img {
      height: 40px;
    }
  }

  > a {
    display: none;

    //mobile
    @media ${device.tablet} {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 1;
    }

    svg {
      color: #53bf99;
      width: 24px;
      height: 24px;
      transition: opacity 0.2s;
      &:hover {
        opacity: 0.8;
      }
    }
  }

  button {
    margin-left: auto;
    background: transparent;
    border: 0;

    //mobile
    @media ${device.tablet} {
      display: none;
    }

    svg {
      color: #53bf99;
      width: 24px;
      height: 24px;
      transition: opacity 0.2s;
      &:hover {
        opacity: 0.8;
      }
    }
  }
`;

export const Profile = styled.div`
  display: flex;
  align-items: center;
  margin-left: 80px;

  // mobile
  @media ${device.tablet} {
    margin-left: 0px;
  }

  > div {
    margin-right: 15px;
  }

  div {
    display: flex;
    flex-direction: column;
    margin-left: 16px;
    line-height: 24px;

    @media ${device.tablet} {
      display: none;
      visibility: hidden;
    }

    span {
      font-size: 16px;
      font-weight: 400;
      color: #f0f2f5;
    }

    a {
      font-size: 16px;
      text-decoration: none;
      color: #53bf99;
      transition: opacity 0.2s;

      strong {
        font-weight: 600 !important;
      }

      &:hover {
        opacity: 0.8;
      }
    }
  }
`;

export const Content = styled.main`
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  margin-top: -10rem;
  flex-direction: column;

  // mobile
  @media ${device.laptopM} {
    padding: 0 20px;
    margin: 0 auto;
  }
`;

export const Schedule = styled.div`
  flex: 1;
  margin-right: 80px;
  // mobile
  @media ${device.laptopM} {
    margin-right: 0;
  }

  h1 {
    color: #000;
    font-weight: 200;
    font-size: 36px;

    // mobile
    @media ${device.laptopM} {
      color: #000;
      font-size: 22px;
      font-weight: 400;
      margin-top: 15px;
    }
  }

  p {
    margin-top: 8px;
    color: #53bf99;
    display: flex;
    align-items: center;
    font-weight: 600;

    span {
      display: flex;
      align-items: center;

      @media ${device.laptopM} {
        display: none;
      }
    }

    span + span::before {
      content: "";
      width: 1px;
      height: 12px;
      background: #53bf99;
      margin: 0 8px;
    }
  }
`;

export const DLs = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  h1 {
    color: #f0f2f5;
    font-weight: 200;
    font-size: 36px;

    // mobile
    @media ${device.laptopM} {
      color: #000;
      font-size: 22px;
      font-weight: 400;
      margin-top: 15px;
    }
  }

  p {
    margin-top: 8px;
    color: #53bf99;
    display: flex;
    align-items: center;
    font-weight: 600;

    span {
      display: flex;
      align-items: center;

      @media ${device.laptopM} {
        display: none;
      }
    }
  }
`;

export const CardContent = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: 120px 120px 120px 120px 120px;
  gap: 10px;
  margin-bottom: 30px;
  position: relative;
  width: 99%;
`;

export const Card = styled.div`
  /* position: relative; */
  width: 120px;
  height: 140px;
  background: #fff;
  border-radius: 10px;
  position: relative;
  padding: 10px 0px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  flex-direction: column;
  cursor: pointer;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  transition-property: box-shadow, transform, filter, border-color;
  transition-duration: 0.2s;
  border: 2px solid #e8ebed;
  filter: blur(0);

  p {
    color: #333;
    margin-top: 10px;
    font-size: 14px;
  }

  &:last-of-type {
    margin-right: 30px;
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 5px 35px rgba(0, 0, 0, 0.05),
      0 5px 10px rgba(0, 0, 0, 0.01);
  }

  &:after {
    content: "✔";

    opacity: 0;
    font-weight: 900;
    position: absolute;
    height: 36px;
    width: 36px;
    top: -21px;
    right: -21px;
    color: #f0f2f5;
    background: #0057ff;
    border: 2px solid #0057ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  span {
    background: red;
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
    border-radius: 6px;
    height: 1.5rem;
    min-width: 2rem;
    display: inline-block;
    text-align: center;
    padding: 0 4px;
    color: #f2f2f2;
  }
`;

export const Section = styled.section`
  margin-top: 48px;

  // mobile
  @media ${device.laptopM} {
    margin-top: 10px;
  }

  > strong {
    color: #999591;
    font-size: 20px;
    line-height: 26px;
    border-bottom: 1px solid #3e3b47;
    display: block;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }

  > p {
    color: #999591;
  }

  header {
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      max-width: 340px;
    }
    p {
      color: #999591;
      font-size: 26px !important;
      font-weight: 400;
      margin-bottom: -1em;
    }
  }
`;

interface ITransactionsProps {
  type: "received" | "sent";
  status: "pending" | "approved" | "unapproved" | "failed";
}

export const Transaction = styled.div<ITransactionsProps>`
  display: flex;
  align-items: center;
  font-family: "Poppins", "Open Sans", sans-serif;
  cursor: pointer;

  opacity: ${(props) =>
    ["unapproved", "failed"].includes(props.status) ? "0.6" : "1"};

  & + div {
    margin-top: 16px;
  }
  /* mobile */
  @media ${device.laptopM} {
    &:last-of-type {
      margin-bottom: 200px;
    }
  }

  > span {
    margin-left: auto;
    display: flex;
    align-items: center;
    color: #999591;
    font-weight: 600;
    font-size: 14px;
    width: 81px;
    /* mobile */
    @media ${device.tabletL} {
      display: none;
    }

    svg {
      width: 18px;
      height: 18px;
      color: #53bf99;
      margin-right: 8px;
    }
  }

  > div {
    background: #fff;
    box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
    display: flex;
    flex: 1;
    align-items: center;
    padding: 16px 24px;
    border-radius: 10px;
    margin-left: 24px;
    position: relative;

    /* mobile */
    @media ${device.tablet} {
      margin-left: 0;
    }

    &::before {
      content: "";
      position: absolute;
      border-radius: 0 5px 5px 0;
      height: 80%;
      width: 4px;
      left: 0;
      top: 10%;
      /* background: ${(props) =>
        props.type === "received" ? "#53bf99" : "#e65d5e"}; */

      background: ${(props) =>
        // eslint-disable-next-line no-nested-ternary
        ["unapproved", "failed"].includes(props.status)
          ? "#999591"
          : props.type === "received"
          ? "#53bf99"
          : "#e65d5e"}};
   }
    transition: transform 0.2s;
    &:hover {
      transform: translateX(10px);
    }

    section {
      display: flex;
      flex: 1;
      flex-direction: row;
      align-items: center;
    }
  }

  .sb-avatar--text {
    span {
      width: initial;
      margin: 0 auto;
      align-self: center;
      color: inherit;
    }
  }
`;

interface IInfoTransaction {
  status: "pending" | "approved" | "unapproved" | "failed";
}
export const InfoTransaction = styled.div<IInfoTransaction>`
  flex: 1;
  margin-left: 10px;
  span {
    display: flex;
    align-items: center;
    h4 {
      font-weight: 400;
      line-height: 21px;
      font-size: clamp(1rem, 2.5vw, 1.3rem);
      text-transform: capitalize;
      color: #00007d;
      ${(props) =>
        ["unapproved", "failed"].includes(props.status) &&
        css`
          text-decoration: line-through;
          font-style: italic;
          color: #999591;
        `}
    }
    h6 {
      font-weight: 400;
      font-size: clamp(0.8rem, 2.5vw, 1.3rem);
      text-decoration: line-through;
      font-style: italic;
      color: #999591;
    }
  }

  strong {
    font-size: clamp(0.7rem, 2.5vw, 1rem);
    line-height: 18px;
    color: #999591;
  }
`;

interface IBalanceTransactionProps {
  type: "received" | "sent";
  status: "pending" | "approved" | "unapproved" | "failed";
}
export const BalanceTransaction = styled.div<IBalanceTransactionProps>`
  text-align: end;

  div {
    display: flex;
    align-items: center;
    min-width: 75px;
    justify-content: space-between;

    ${(props) =>
      ["unapproved", "failed"].includes(props.status) &&
      css`
        text-decoration: line-through;
        font-style: italic;
        color: #999591;
      `}

    h2 {
      font-weight: 400;
      font-size: clamp(1rem, 2.5vw, 1.5rem);
      color: ${(props) => (props.type === "received" ? "#53bf99" : "#e65d5e")};
      line-height: 30px;
    }

    svg {
      margin-right: 10px;
      fill: #b3b3b3;
    }
  }

  strong {
    font-size: 14px;
    line-height: 18px;
    color: #999591;
  }
`;

export const Calendar = styled.aside`
  width: 380px;

  @media ${device.laptopM} {
    min-width: 280px;
    width: 100%;
  }

  section {
    display: flex;
    flex-direction: row;
    margin-top: 20px;
    justify-content: space-between;

    // mobile
    @media ${device.laptopM} {
      display: none;
    }
  }
`;

export const Footer = styled.footer`
  position: fixed;
  left: 0;
  bottom: 0;
  height: 80px;
  width: 100%;
  background-color: #fff;
  display: none;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  // mobile
  @media ${device.laptopM} {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button {
    max-width: 300px;
    margin: 0 10px 0 5px;
  }
`;

export const TransactionInfo = styled.div`
  padding: 0;
  margin: 0;

  ul {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    list-style: none;

    li {
      width: 100%;
      display: flex;
      flex-direction: row;

      padding: 3px 0;

      strong {
        font-weight: bold;
      }

      p {
        margin-left: 5px;
      }
    }
  }
`;

export const TransactionMessageInfo = styled.section`
  margin-top: 50px;
  text-align: justify;

  label {
    font-weight: bold;
  }
  p {
    padding: 8px;
    background: #e3e3e3;
    border-radius: 10px;
  }
`;
