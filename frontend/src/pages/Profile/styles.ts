import { lighten, shade } from "polished";
import styled from "styled-components";

import { device } from "../../styles/devices";
import { Avatar } from "../../styles/global";

export const Container = styled.div`
  > header {
    height: 144px;
    background: #000034;
    border-radius: 0 0 0 100px;
    display: flex;
    /* align-items: flex-start; */

    // mobile
    @media ${device.laptopL} {
      border-radius: 0 0 0 0;
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

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: -176px auto 0;
  width: 100%;

  form {
    margin: 80px 0;
    width: 340px;
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

    a {
      color: #e65d5e;
      display: block;
      margin-top: 24px;
      text-decoration: none;
      transition: color 0.2s;
      font-weight: 600;

      display: none;
      align-items: center;
      justify-content: center;

      // mobile
      @media ${device.tablet} {
        display: flex;
        /* visibility: hidden; */
      }

      &:hover {
        color: ${shade(0.2, "#E65D5E")};
      }

      svg {
        margin-left: -16px;
        margin-right: 16px;
      }
    }
  }
`;

export const AvatarInput = styled.div`
  margin-bottom: 32px;
  position: relative;
  align-self: center;

  label {
    position: absolute;
    border: 0;
    background: #7f3e8f;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    right: 0;
    bottom: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: background-color 0.2s;

    input {
      display: none;
    }

    svg {
      color: #f4ede8;
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: ${shade(0.2, "#7F3E8F")};
    }
  }
`;
