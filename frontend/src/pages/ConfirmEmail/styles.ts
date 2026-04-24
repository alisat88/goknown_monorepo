import { lighten, shade } from "polished";
import PinField from "react-pin-field/lib/";
import styled, { keyframes } from "styled-components";

import siginBackgroundImg from "../../assets/sign-in-background.jpg";

export const Container = styled.div`
  height: 100vh;

  display: flex;
  align-items: stretch;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 700px;

  img {
    max-width: 340px;
  }
`;

const appearFromleft = keyframes`
  from{
    opacity: 0;
    transform: translateX(-50px);
  }
  to{
    opacity: 1;
    transform: translateX(0);
  }
`;

export const AnimationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  animation: ${appearFromleft} 1s;
  form {
    margin: 80px 0;
    width: 340px;
    text-align: center;

    h2 {
      text-align: left;
      margin-bottom: 5px;
    }

    p {
      font-size: 16px;
      font-weight: 300;
      text-align: left;
    }

    a {
      color: #00007d;
      display: block;
      margin-top: 24px;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: ${lighten(0.4, "#00007D")};
      }
    }
    > a {
      text-align: right;
    }

    .pin-field {
      width: 56px;
      height: 75px;
      font-size: 40px;
      text-align: center;
      outline: none;
      border-radius: 5px;
      border: 2px solid #ebebeb;
      transition-property: color, border, box-shadow, transform;
      transition-duration: 250ms;
      margin: 30px 0 20px;

      font-family: "Open Sans";
      font-weight: 400 !important;
      color: #00007d;

      & + input {
        margin-left: 10px;
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 7px rgba(#00007d, 0.5);
        border: 1px solid #00007d;
        transform: scale(1.05);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6 !important;
        background: #fff !important;
      }
    }
  }

  > a {
    color: #7f3e8f;
    display: block;
    text-decoration: none;
    transition: color 0.2s;
    font-weight: 600;
    display: flex;
    align-items: center;

    &:hover {
      color: ${shade(0.2, "#7F3E8F")};
    }

    svg {
      margin-right: 16px;
    }
  }
`;

export const Background = styled.div`
  flex: 1;
  background: url(${siginBackgroundImg}) no-repeat center;
  background-size: cover;
`;

export const ResendPin = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  margin-top: 24px;
  min-height: 46px;
`;
