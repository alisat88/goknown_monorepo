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
      max-width: 1120px;
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
  justify-content: flex-start;
  margin: 0 auto 0;

  margin-top: -5rem;
  width: 100%;
  padding: 1rem;
  min-height: calc(100vh - 170px);
  height: 100%;
  /* border-radius: 1.25rem;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.3);
  background: #fff; */
  @media ${device.laptopM} {
    margin-top: 1rem !important;
  }
  /* > div {
    width: 100%;
    height: 100%;
    border-radius: 1.25rem;
    box-shadow: none;
  } */
`;

export const ChatContent = styled.main`
  border-radius: 1.25rem;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.3);
  background: #fff;

  width: 100%;
  max-width: 1120px;
  height: calc(100vh - 180px);

  display: flex;
  flex-direction: row;
  div {
    position: relative;
  }
  @media ${device.laptopM} {
    margin: -1rem;
  }
`;

export const Messages = styled.div`
  header {
    display: flex;
    width: 100%;
    background: #fff;
    padding: 1rem;
    align-items: center;
    h2 {
      font-size: 1.5rem;
      color: #333;
      margin-left: 1rem;
    }
  }

  margin: 0;

  width: 100%;
  background: #eeee;
  border-radius: 0 1.25rem 1.25rem 0;
  flex-direction: column;

  display: flex;

  ul {
    padding: 1rem;
    flex: 1;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    height: calc(100% - 90px);
    list-style: none;

    li {
      div {
        display: flex;
        flex-direction: column;

        p {
          text-align: left;

          padding: 0;
          margin: 0;
          font-size: 0.9rem;
        }
        strong {
          font-size: 0.7rem;
          padding: 0;
          margin: 0;
          white-space: nowrap;
          margin-left: 0.3rem;
          text-align: right;
          opacity: 0.7;
          font-style: italic;
          padding-bottom: 0.4rem;
        }
      }
    }
  }
  form {
    padding: 1rem;
    height: 90px;
  }

  .list__item.list__item--mine {
    text-align: right;
    display: flex;
    justify-content: end;
  }

  .list__item.list__item--other {
    text-align: left;
    display: flex;
    justify-content: start;
  }

  .message {
    border: 1px solid transparent;
    border-radius: 0 1rem;

    max-width: 80%;
    list-style: none;
    margin-bottom: 1rem;
    padding: 0.5rem 0.5rem 0;
  }

  .message.message--mine {
    background: #c3e88d;
    /* border-color: #82be27; */
    text-align: right;
  }

  .message.message--other {
    background: #89ddff;
    /* border-color: #1abeff; */
  }
`;

export const Users = styled.ul`
  width: 300px;
  padding: 5rem 0 1rem;
  list-style: none;

  li {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0.5rem 0.8rem;

    cursor: pointer;
    transition: background 0.2s ease-in-out;
    h4 {
      font-size: 0.9rem;
      margin-left: 0.4rem;
      color: #333;
    }

    &:hover {
      background: #f4f4f4;
    }

    .number {
      display: none;
    }

  &.active {
    background: #ededed;
    h4 {
      color: #000;
      font-weight: bold;
    }
  }
  &.new {

    .number {
      position: absolute;
      display: inline-block;
      color: #fff;
      background: #53bf99;
      padding: 2px;
      font-size: 0.8rem;
      border-radius: 100%;
      top: 0.2rem;
      right: 0.2rem;
      min-width: 20px;
      text-align: center;
      transform: scale(0.8);
    }
  }
`;
