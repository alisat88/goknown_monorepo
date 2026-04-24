import styled, { css } from "styled-components";

import { device } from "../../styles/devices";

interface ICardProps {
  selected?: boolean;
}

interface IFlagProps {
  type: "cancelled" | "completed" | "pending";
}

export const Container = styled.div``;

export const Header = styled.header`
  padding: 32px 0;
  height: 120px;
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
`;

export const Content = styled.main`
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  margin-top: -7rem;

  // mobile
  @media ${device.laptopM} {
    margin: -7rem 20px 0;
    flex-direction: column-reverse;
  }
`;

export const Schedule = styled.div`
  flex: 1;
  margin-right: 60px;

  // mobile
  @media ${device.laptopM} {
    margin-right: 0;
  }

  h1 {
    color: #f0f2f5;
    font-weight: 200;
    font-size: 36px;
    @media ${device.laptopM} {
      display: none;
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
  margin-top: 68px;

  // mobile
  @media ${device.laptopM} {
    margin-top: 30px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    border-bottom: 1px solid #3a4276;
    margin-bottom: 40px;

    h3 {
      color: #00007d;
      font-size: 26px;
      font-weight: 600;
      line-height: 40px;
    }
  }

  div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
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

export const CardMethod = styled.div<ICardProps>`
  display: flex;
  flex-direction: column !important;
  padding: 25px;

  width: 30%;
  position: relative;
  background: #fff;
  border: 2px solid ${(props) => (props.selected ? "#0057ff" : "#e8ebed")};
  padding: 25px;
  box-sizing: border-box;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;

  transition: all 0.5s;

  @media ${device.tablet} {
    width: 33%;
    padding: 25px 10px;
    min-height: 148px;
    justify-content: center !important;
  }

  svg {
    width: 48px;
    height: 48px;
    color: ${(props) => (props.selected ? "#0057ff" : "#8a959c")};
  }

  p {
    font-size: 14px;
    color: ${(props) => (props.selected ? "#0057ff" : "#333")};
  }

  &:after {
    content: "✔";
    z-index: 100;
    opacity: 0;
    font-weight: 900;
    position: absolute;
    height: 40px;
    width: 40px;
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

  ${(props) =>
    props.selected &&
    css`
      &:after {
        opacity: 1;
      }
    `}

  &:hover {
    border: 2px solid #0057ff;
    p,
    svg {
      color: #0057ff;
    }
  }
`;

export const LastCharges = styled.div`
  margin-top: 20px;

  @media ${device.laptopM} {
    display: none;
  }
  header {
    border-bottom: 1px solid #3a4276;
    h5 {
      font-size: 22px;
      color: #00007d;
    }
  }

  ul {
    margin-top: 20px;
    list-style: none;
    li {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 5px 0;

      & + li {
        margin-top: 20px;
        border-top: 2px solid #b3b3b3;
      }

      svg {
        color: #8a959c;
        width: 36px;
        height: 36px;
      }
      div {
        padding-left: 15px;
        display: flex;
        flex-direction: column;
        p {
          font-size: 16px;
          color: #333;
        }
        strong {
          color: #8a959c;
          font-size: 14px;
        }
      }
    }
  }
`;
export const Flag = styled.span<IFlagProps>`
  margin: 0 0 0 auto;
  min-width: 90px;
  text-align: center;
  background-color: ${(props) =>
    props.type === "completed" ? "#53BF99" : "#E65D5E"};
  border-radius: 6px;
  padding: 4px 8px;
  color: #f0f2f5;
  font-weight: bold;
`;
