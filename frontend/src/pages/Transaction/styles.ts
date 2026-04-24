import { shade } from "polished";
import styled, { css } from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div`
  > header {
    height: 200px;
    background: #000034;
    border-radius: 0 0 0 100px;
    display: flex;
    /* align-items: flex-start; */

    // mobile
    @media ${device.laptopL} {
      border-radius: 0 0 0 0;
    }

    // mobile
    @media ${device.laptopM} {
      height: 144px;
    }

    div {
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding: 16px 0;

      // mobile
      @media ${device.laptopM} {
        margin: 0 10px 0;
      }

      svg {
        color: #f0f2f5;
        width: 24px;
        height: 24px;
      }
    }
  }
`;

export const Header = styled.header`
  padding: 32px 0;
  background: #000034;
`;

export const SubHeader = styled.header`
  height: 110px;
  background: #000034;
  border-radius: 0 0 0 100px;

  // mobile
  @media ${device.laptopL} {
    border-radius: 0 0 0 0;
  }
`;

export const HeaderContent = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  align-items: center;

  // mobile
  @media ${device.laptopM} {
    margin: 0 20px 0;
  }

  > img {
    height: 40px;
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
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  margin-top: -7rem;

  // mobile
  @media ${device.laptopM} {
    margin: -4rem 20px 0;
    flex-direction: column-reverse;
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

    span + span::before {
      content: "";
      width: 1px;
      height: 12px;
      background: #53bf99;
      margin: 0 8px;
    }
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

export const LatestTransaction = styled.div<ITransactionsProps>`
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
    @media ${device.mobileL} {
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

export const CardBalance = styled.div`
  width: 100%;
  height: 150px;
  background: #53bf99;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 5px 35px rgba(0, 0, 0, 0.05),
      0 5px 10px rgba(0, 0, 0, 0.01);
  }

  header {
    display: flex;
    align-items: center;
    h5 {
      flex: 1;
      font-family: "Abel", sans-serif;
      color: #f0f2f5;
      font-size: 18px;
    }

    svg {
      fill: #f0f2f5 !important;
      width: 32px !important;
      height: 32px !important;
    }
  }

  div {
    margin-top: 20px;
    h1 {
      color: #f0f2f5;
      font-size: 36px;
      line-height: 50px;
      font-weight: 400;
    }
  }
`;

export const SendToken = styled.div`
  background: #7f3e8f;
  width: 180px;
  height: 180px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  transition-property: box-shadow, color;
  transition-duration: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  svg {
    width: 40px;
    height: 40px;
    stroke-width: 1px;
    color: #f0f2f5;
    transition: color 0.2s;
  }

  p {
    margin-top: 10px;
    color: #f0f2f5;
    font-family: "Poppins";
    font-size: 18px;
    transition: color 0.2s;
  }

  &:hover {
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 5px 35px rgba(0, 0, 0, 0.05),
      0 5px 10px rgba(0, 0, 0, 0.01);

    svg,
    p {
      color: ${shade(0.2, "#f0f2f5")};
    }
  }
`;

export const BuyToken = styled.div`
  background: #00007d;
  width: 180px;
  height: 180px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  transition-property: box-shadow, color;
  transition-duration: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  svg {
    width: 40px;
    height: 40px;
    stroke-width: 1px;
    color: #f0f2f5;
    transition: color 0.2s;
  }

  p {
    margin-top: 10px;
    color: #f0f2f5;
    font-family: "Poppins";
    font-size: 18px;
    transition: color 0.2s;
  }

  &:hover {
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 5px 35px rgba(0, 0, 0, 0.05),
      0 5px 10px rgba(0, 0, 0, 0.01);

    svg,
    p {
      color: ${shade(0.2, "#f0f2f5")};
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
