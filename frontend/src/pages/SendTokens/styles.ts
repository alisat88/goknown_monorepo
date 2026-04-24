import { shade } from "polished";
import styled, { css } from "styled-components";

import { device } from "../../styles/devices";

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

  button {
    margin-left: auto;
    background: transparent;
    border: 0;

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

  @media ${device.laptopM} {
    margin-right: 0;
  }

  h1 {
    color: #f0f2f5;
    font-weight: 200;
    font-size: 36px;

    // mobile
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

    @media ${device.laptopM} {
      display: none;
    }

    span {
      display: flex;
      align-items: center;
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

  & + section {
    margin-top: 30px;
  }

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

    button {
      border: 0;
      background: none;

      svg {
        color: #3a4276;
        width: 24px;
        height: 24px;
      }
    }
  }

  > div {
    position: relative;
    min-height: 170px;
    padding-left: 60px;
    form {
      display: flex;
      flex: 1;
    }
    > svg {
      padding-left: 20px;
    }
  }
  div {
    display: flex;
    /* margin: 20px 0; */
    align-items: center;

    & + div {
      margin-left: 20px;
    }
  }

  form {
    div {
      margin-left: 0;
    }
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

export const CardContent = styled.div`
  overflow-y: auto;
  min-height: 200px;
  height: 200px;
  max-width: 538px;
`;

interface ICardUserProps {
  blurred?: boolean;
  selected: boolean;
}

export const CardUser = styled.div<ICardUserProps>`
  /* position: relative; */
  min-width: 120px;
  height: 140px;
  background: #fff;
  border-radius: 10px;

  padding: 20px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  transition-property: box-shadow, transform, filter, border-color;
  transition-duration: 0.2s;
  border: 2px solid ${(props) => (props.selected ? "#0057ff" : "#e8ebed")};
  filter: blur(0);

  strong {
    color: #00007d;
    margin-top: 10px;
    font-size: 16px;
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

  ${(props) =>
    props.selected &&
    css`
      &:after {
        opacity: 1;
      }
    `}

  ${(props) =>
    props.blurred &&
    css`
      cursor: default;
      filter: blur(10px);
      &:hover {
        cursor: default;
        transform: translateY(0);
        box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
      }
    `}
`;
