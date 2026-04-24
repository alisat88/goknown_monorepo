import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div<{ height?: number; mobileHeight?: number }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  > header {
    height: ${(props) => (props.height ? `${props.height}px` : "200px")};
    z-index: 99999;
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
      padding: 16px 0;
      align-items: baseline;
      button {
        display: none;
      }

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
`;

export const Content = styled.main`
  max-width: 1480px;
  width: 100%;
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  margin-top: -3rem;

  // mobile
  @media ${device.laptopM} {
    margin: -3rem auto;
    padding: 0 10px;
    flex-direction: column-reverse;
  }

  .invitation-section {
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
  }
`;

export const ListHeader = styled.li`
  display: flex;
  width: 100%;
  background-color: #d2d2d2;
  padding: 0.5rem;
  border-radius: 0.875rem 0.875rem 0 0;
  font-weight: bold;
  color: #333;
`;

export const ListItem = styled.li`
  display: flex;
  background-color: #fff;
  padding: 0.5rem;
  align-items: center;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  position: relative;

  &:before {
    content: "";
    background-color: #f2f2f2;
    width: 90%;
    height: 1px;
    position: absolute;
    position: absolute;
    top: 98%; /* position the top  edge of the element at the middle of the parent */
    left: 50%; /* position the left edge of the element at the middle of the parent */

    transform: translate(-50%, -50%);
  }

  &:last-of-type {
    &:before {
      height: 0px;
    }
  }
`;

export const List = styled.ul`
  list-style: none;
  max-width: 1080px;

  ${ListItem} {
    &:last-of-type {
      border-radius: 0 0 0.875rem 0.875rem;
    }
  }
`;

type IColumn = {
  flex?: number;
};

export const Column = styled.div<IColumn>`
  flex-direction: column;
  margin-left: 0.5rem;
  flex: ${(props) => (props.flex ? props.flex : 1)};

  p {
    color: #333 !important;
  }
  > span {
    color: #333;
    font-style: italic;
    opacity: 0.9;
  }

  button {
    background: transparent !important;
    border: none !important;

    pointer-events: painted;
    padding: 20px;
    margin-right: -1rem;

    transition: transform 0.2s ease-in-out;

    svg {
      z-index: 2 !important;
      color: #333 !important;
      background: transparent !important;
      padding: none;
      height: 18px;
      width: 18px;

      padding: 0 !important;
    }

    &:hover {
      transform: scale(1.3);
    }
  }
`;

export const Schedule = styled.div`
  flex: 1;
  /* margin-right: 50px; */
  margin-top: 4rem;

  // mobile
  @media ${device.laptopM} {
    margin-top: 3.5rem;
  }

  > header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    button {
      width: 200px !important;
    }

    h1 {
      color: #f0f2f5;
      font-weight: 200;
      font-size: 36px;

      // mobile
      @media ${device.laptopM} {
        font-size: 22px;
        font-weight: 400;
        margin-top: 15px;

        button {
          width: 150px !important;
        }
      }
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

  // mobile
  @media ${device.laptopM} {
    margin-right: 0;
    > header {
      display: none;
    }
  }

  form {
    margin: 1rem 0;
  }
`;

export const FlagToken = styled.span`
  display: block;
  background-color: #ecebf3;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  min-width: 10rem;
  width: 16rem;
  overflow: hidden !important;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 500;
  color: #8c8dab !important;
`;

export const LogInfo = styled.div`
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
