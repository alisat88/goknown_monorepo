import styled, { css } from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(
      circle at 18% 8%,
      rgba(83, 191, 153, 0.16),
      transparent 28%
    ),
    linear-gradient(135deg, #070920 0%, #000034 48%, #061827 100%);
  color: #f8fafc;
`;

export const DashboardShell = styled.div`
  min-height: 100vh;
`;

export const Sidebar = styled.aside<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  width: 272px;
  display: flex;
  flex-direction: column;
  background: rgba(6, 10, 31, 0.96);
  border-right: 1px solid rgba(83, 191, 153, 0.18);
  box-shadow: 18px 0 45px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(16px);

  @media ${device.laptopM} {
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
    transition: transform 0.25s ease;
  }
`;

export const SidebarBrand = styled.div`
  min-height: 86px;
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(83, 191, 153, 0.14);

  img {
    width: 42px;
    height: 42px;
    object-fit: contain;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.94);
    padding: 5px;
  }

  div {
    min-width: 0;
  }

  strong {
    display: block;
    color: #f8fafc;
    font-size: 17px;
    line-height: 1.2;
  }

  span {
    display: block;
    margin-top: 4px;
    color: #8fa4ba;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
`;

export const SidebarNav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px;
`;

export const SidebarNavItem = styled.button<{ $isActive: boolean }>`
  width: 100%;
  min-height: 48px;
  margin-bottom: 7px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid
    ${(props) =>
      props.$isActive ? "rgba(103, 232, 249, 0.38)" : "transparent"};
  border-radius: 12px;
  background: ${(props) =>
    props.$isActive
      ? "linear-gradient(90deg, #2563eb 0%, #0891b2 100%)"
      : "transparent"};
  color: ${(props) => (props.$isActive ? "#fff" : "#9fb2c7")};
  font-weight: 700;
  text-decoration: none;
  text-align: left;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;

  img {
    width: 28px;
    height: 28px;
    padding: 5px;
    flex: 0 0 auto;
    object-fit: contain;
    border-radius: 9px;
    background: ${(props) =>
      props.$isActive
        ? "rgba(255, 255, 255, 0.18)"
        : "rgba(148, 163, 184, 0.1)"};
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    color: #f8fafc;
    background: ${(props) =>
      props.$isActive
        ? "linear-gradient(90deg, #2563eb 0%, #0891b2 100%)"
        : "rgba(83, 191, 153, 0.11)"};
    border-color: rgba(83, 191, 153, 0.2);
    transform: translateX(2px);
  }
`;

export const SidebarFooter = styled.div`
  padding: 14px;
  border-top: 1px solid rgba(83, 191, 153, 0.14);
`;

export const SidebarAction = styled.button`
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #9fb2c7;
  font-weight: 700;
  transition: background 0.2s, color 0.2s;

  & + button {
    margin-top: 4px;
  }

  svg {
    width: 20px;
    height: 20px;
    color: #8be7d7;
  }

  &:hover {
    color: #f8fafc;
    background: rgba(83, 191, 153, 0.11);
  }
`;

export const MainArea = styled.div`
  min-height: 100vh;
  margin-left: 272px;

  @media ${device.laptopM} {
    margin-left: 0;
  }
`;

export const MobileMenuButton = styled.button`
  display: none;

  @media ${device.laptopM} {
    position: fixed;
    top: 18px;
    left: 18px;
    z-index: 40;
    width: 44px;
    height: 44px;
    border: 1px solid rgba(83, 191, 153, 0.34);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(6, 10, 31, 0.94);
    color: #f8fafc;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);

    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

export const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 15;
  min-height: 86px;
  padding: 18px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: rgba(3, 7, 32, 0.74);
  border-bottom: 1px solid rgba(83, 191, 153, 0.14);
  backdrop-filter: blur(16px);

  > div:first-child {
    min-width: 0;
  }

  span {
    display: block;
    color: #8be7d7;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h1 {
    color: #f8fafc;
    font-size: 28px;
    line-height: 1.1;
    margin-top: 6px;
  }

  @media ${device.laptopM} {
    padding: 18px 18px 18px 78px;
  }

  @media ${device.mobileL} {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 18px 0;
  background: rgba(3, 7, 32, 0.82);
  border-bottom: 1px solid rgba(83, 191, 153, 0.18);
  backdrop-filter: blur(16px);
`;

export const SubHeader = styled.header`
  height: 96px;
  background: linear-gradient(180deg, rgba(0, 0, 52, 0.74), rgba(0, 0, 52, 0));

  @media ${device.laptopM} {
    height: 32px;
  }
`;

export const HeaderContent = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 24px;

  @media ${device.laptopM} {
    padding: 0 18px;
  }

  div.logo {
    display: flex;
    flex-direction: column;

    p {
      color: #f2f2f2;
      font-size: 0.8rem;
      opacity: 0.8;
    }

    > img {
      height: 38px;
      width: auto;
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
      color: #8be7d7;
      width: 22px;
      height: 22px;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  button {
    margin-left: auto;
    background: rgba(83, 191, 153, 0.1);
    border: 1px solid rgba(83, 191, 153, 0.26);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, background 0.2s, border-color 0.2s;

    @media ${device.tablet} {
      display: none;
    }

    svg {
      color: #8be7d7;
      width: 20px;
      height: 20px;
      transition: opacity 0.2s;
    }

    &:hover {
      background: rgba(83, 191, 153, 0.18);
      border-color: rgba(83, 191, 153, 0.48);
      transform: translateY(-1px);
    }
  }
`;

export const Profile = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 8px 14px 8px 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.42);

  @media ${device.tablet} {
    margin-left: 0px;
    margin-right: auto;
    padding: 0;
    border: 0;
    background: transparent;
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
      font-size: 13px;
      font-weight: 400;
      color: #9fb2c7;
    }

    a {
      font-size: 15px;
      text-decoration: none;
      color: #f8fafc;
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
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
  margin-top: 0;
  flex-direction: column;
  padding: 28px;

  @media ${device.laptopM} {
    padding: 22px 18px 32px;
    margin: 0 auto;
  }
`;

export const Schedule = styled.div`
  flex: 1;

  @media ${device.laptopM} {
    margin-right: 0;
  }

  h1 {
    color: #f8fafc;
    font-weight: 700;
    font-size: 24px;
    margin: 0;

    @media ${device.laptopM} {
      font-size: 21px;
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

export const MetricsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media ${device.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${device.laptopM} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media ${device.mobileL} {
    grid-template-columns: 1fr;
  }
`;

export const MetricCard = styled.article`
  min-height: 122px;
  border: 1px solid rgba(83, 191, 153, 0.2);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(
    145deg,
    rgba(12, 24, 54, 0.86),
    rgba(2, 8, 23, 0.72)
  );
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);

  span {
    display: block;
    color: #98a8bc;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    color: #f8fafc;
    font-size: 30px;
    line-height: 1.1;
    margin-top: 12px;
    font-weight: 800;
  }

  svg {
    width: 42px;
    height: 42px;
    padding: 10px;
    border-radius: 14px;
    color: #8be7d7;
    background: rgba(83, 191, 153, 0.13);
  }
`;

export const DashboardPanel = styled.section`
  border: 1px solid rgba(83, 191, 153, 0.18);
  border-radius: 18px;
  padding: 22px;
  background: linear-gradient(
    145deg,
    rgba(12, 24, 54, 0.78),
    rgba(2, 8, 23, 0.7)
  );
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.24);

  .dashboard-asset-row {
    & + .dashboard-asset-row {
      margin-top: 14px;
    }

    > div {
      background: rgba(15, 23, 42, 0.82);
      border: 1px solid rgba(148, 163, 184, 0.15);
      box-shadow: none;

      h4 {
        color: #f8fafc;
        font-weight: 700;
      }

      strong {
        color: #98a8bc;
      }

      button svg {
        color: #8be7d7 !important;
      }
    }
  }

  @media ${device.mobileL} {
    padding: 16px;
  }
`;

export const PanelHeader = styled.header`
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  span {
    display: block;
    color: #8be7d7;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 6px;
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
