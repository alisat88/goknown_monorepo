import styled from "styled-components";

import { Container as DatePicker } from "../../../components/DatePicker/styles";
import { Container as Input } from "../../../components/Input/styles";
import { Container as Radio } from "../../../components/Radio/styles";
import { Container as TextArea } from "../../../components/TextArea/styles";
import { Container as Toggle } from "../../../components/Toggle/styles";
import { device } from "../../../styles/devices";

export const Container = styled.div<{ height?: number; mobileHeight?: number }>`
  body,
  input,
  button,
  p,
  textarea {
    font-family: "Open Sans", serif;
    font-size: 16px;
  }

  h1,
  h2 {
    font-family: "Open Sans";
  }

  h2 {
    font-size: 28px;
    color: #00007d;
    font-weight: 300;
  }

  h1,
  h3,
  h4,
  h5,
  h6,
  strong {
    font-weight: 500;
  }
  p {
    font-weight: normal;
    color: #000 !important;
  }

  > header {
    height: ${(props) => (props.height ? `${props.height}px` : "200px")};
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
      height: ${(props) =>
        props.mobileHeight ? `${props.mobileHeight}px` : "144px"};
    }

    div {
      width: 100%;
      max-width: 1080px;
      margin: 0 auto;
      padding: 16px 0;
      align-items: baseline;
      button {
        display: none;
      }

      h1 {
        color: #f0f2f5;
        font-weight: 200;
        font-size: 36px;
      }
      // mobile
      @media ${device.laptopM} {
        margin: 0 10px 0;
        display: flex;

        button {
          display: flex;
          width: 220px !important;
        }

        h1 {
          display: none;
        }
      }

      svg {
        color: #f0f2f5;
        width: 24px;
        height: 24px;
      }
    }
  }
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0;
  width: 100%;
  max-width: 700px;
  padding: 1rem;
  height: 100%;
  form {
    width: 100%;
    height: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;

    h1 {
      margin-bottom: 24px;

      text-align: left;

      font-weight: 200;
      font-size: 36px;
      @media ${device.laptopM} {
        display: none;
      }
    }
    p {
      text-align: left;
      margin-top: 0.65rem !important;
    }
    h3 {
      text-align: left;
      margin-top: 1rem;
      font-weight: bold;
      font-size: 1.2rem;
      color: #333 !important;
    }

    br {
      display: block;
      padding: 0.5rem 0;
    }

    > section {
      align-items: center;
      margin-top: 1rem;
      position: relative;
      min-height: 170px;
      padding-left: 60px;
      display: flex;

      > svg {
        padding-left: 20px;
      }
    }

    /* div {
      display: flex;
  
      align-items: center;

      & + div {
        margin-left: 20px;
      }
    } */

    ${Input} {
      margin-bottom: 0.65rem;
    }

    ${TextArea} {
      margin-left: 0 !important;
    }

    ${Radio} {
      flex-direction: column !important;
      align-items: flex-start;
    }

    ${Toggle} {
      margin-left: 0 !important;

      align-items: flex-start;
    }

    ${DatePicker} {
      margin-left: 0 !important;
    }

    footer {
      display: flex;
      flex-direction: column;
      flex: 1;
      align-items: center;
      justify-content: flex-end;
    }
  }
`;
