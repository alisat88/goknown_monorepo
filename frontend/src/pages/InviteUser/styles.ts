import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div<{ height?: number; mobileHeight?: number }>`
  display: flex;
  flex-direction: column;
  height: 100%;
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
      max-width: 1480px;
      margin: 0 auto;
      padding: 16px 10px;
      align-items: baseline;
      display: flex;
      /* button {
        display: none;
      } */

      h1 {
        color: #f0f2f5;
        font-weight: 200;
        font-size: 36px;
        margin-bottom: 1rem;
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

  .table-tiny th,
  .table-tiny td {
    /* padding-left: 4px;
    padding-right: 4px; */
  }
`;

export const Content = styled.main`
  max-width: 1480px;
  width: 100%;
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  /* margin-top: -3rem; */

  // mobile
  @media ${device.laptopM} {
    /* margin: -3rem auto; */
    padding: 0 10px;
    flex-direction: column-reverse;
  }

  /* .invitation-section {
    display: flex;
    flex-direction: row;
    margin-left: 0.5rem;
    button {
      border-radius: 6px;
      border: none;
      height: 2rem;
      padding: 0.6rem 1rem;
      transition: opacity 0.2s ease-in-out;

      &:nth-child(1) {
        margin-bottom: 0.5rem;
        margin-right: 1rem;
      }

      &:hover {
        opacity: 0.8;
      }

      svg {
        color: #f0f2f5;
      }
    }
  } */
`;
