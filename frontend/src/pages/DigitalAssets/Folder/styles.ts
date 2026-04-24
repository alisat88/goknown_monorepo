import styled, { css } from "styled-components";

import { device } from "../../../styles/devices";

export const Container = styled.div<{ height?: number; mobileHeight?: number }>`
  height: ${(props) => `calc(97vh - ${props.height}px)`};
  @media ${device.laptopM} {
    height: ${(props) => `calc(97vh - ${props.mobileHeight}px)`};
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
  margin: 1rem auto 0;
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

    h3 {
      text-align: left;
      margin-top: 3rem;
      margin-bottom: -2rem;
      font-weight: bold;
      font-size: 1.2rem;
      color: #333 !important;
    }

    .welcome-folder {
      display: flex;
      flex-direction: column;
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

    div {
      display: flex;
      /* margin: 20px 0; */
      align-items: center;

      & + div {
        margin-left: 20px;
      }
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

export const CardContent = styled.div<{ isDisabled?: boolean }>`
  overflow-y: auto;
  min-height: 200px;
  height: 200px;
  max-width: 538px;

  ${({ isDisabled }) =>
    isDisabled &&
    css`
      opacity: 0.5;
    `}
`;

interface ICardUserProps {
  blurred?: boolean;
  selected?: boolean;
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

  position: relative;
  pointer-events: none;

  button {
    position: absolute;
    background: transparent;
    border: none;
    height: 2rem;
    width: 2rem;
    background: #c4c4c4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    top: -1rem;
    right: -1rem;
    pointer-events: painted;
    svg {
      color: #fff;
      font-size: 1.2rem;
    }
  }

  strong {
    color: #00007d;
    margin-top: 10px;
    font-size: 16px;
  }

  &:last-of-type {
    margin-right: 30px;
  }

  /* &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 5px 35px rgba(0, 0, 0, 0.05),
      0 5px 10px rgba(0, 0, 0, 0.01);
  } */

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

export const MembersList = styled.div`
  display: block;
  margin-top: -1rem;

  section {
    display: flex;
    padding: 0 !important;
    margin: 0 !important;
    justify-content: flex-start !important;

    > div {
      display: flex;
      align-items: center;
      flex-direction: column;
      margin-right: 3px;
      strong {
        font-size: 0.875rem;
        background: #53bf99;
        padding: 0.2rem 0.5rem;
        border-radius: 1rem;
        color: #f2f2f2;
        transform: scale(0.8);
        margin-top: -0.8rem;
      }
    }

    > div.members-group {
      transition: filter ease-in-out 0.2s;
      cursor: pointer;
      strong {
        background: #53b2bf;
      }

      &:hover {
        filter: brightness(0.8);
      }
    }
  }

  .avatar-shared {
    margin-top: -0.2rem;
  }

  // mobile
  @media ${device.laptopL} {
    margin-top: -1rem;
    .avatar-shared {
      margin-top: 0.2rem;
    }
  }
`;
