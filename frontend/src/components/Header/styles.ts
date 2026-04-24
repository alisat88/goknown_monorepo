import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div<{ height?: number; mobileHeight?: number }>`
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
`;
