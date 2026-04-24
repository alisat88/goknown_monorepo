import "react-perfect-scrollbar/dist/css/styles.css";
import "react-loading-skeleton/dist/skeleton.css";

import AvatarBase from "react-avatar";
import styled, { createGlobalStyle, css } from "styled-components";

import { device } from "./devices";

export default createGlobalStyle`
  *{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    outline: 0;
  }

  #root{
    min-height:100vh;
  

   // force skeleton theme provider 100% 
    /* >div{
      height: 100%;
    } */
  }
  iframe{
    display: none !important;
  }

  body{
    background: #F0F2F5;
    color: #000;
    -webkit-font-smoothing: antialiased;

  }

  body, input, button, textarea {
    font-family: 'Open Sans', serif;
    font-size: 16px;
  }

  h1, h2 {
    font-family: 'Open Sans';
  }

  h2 {
    font-size: 28px;
    color: #00007D;
    font-weight: 300;
  }

  h1,h3,h4,h5,h6,strong {
    font-weight: 500;
  }

  button{
    cursor: pointer;
  }

  .suffix-white{
    /* fill: #fff !important; */
  }
  .react-datepicker-wrapper {
    display: flex;
  }
  .react-datepicker__triangle{
    left: -50% !important;
  }
`;

interface IAvatarProps {
  width?: number;
  height?: number;
  borderColor?: string;
  borderSize?: number;
  fontSize?: number;
}

export const Avatar = styled(AvatarBase)<IAvatarProps>`
  width: ${(props) => props.width || "56"}px !important;
  height: ${(props) => props.height || "56"}px !important;

  .sb-avatar__text {
    ${(props) =>
      props.borderColor &&
      css`
        border: 3px solid ${props.borderColor};
      `}
    span {
      font-size: ${(props) => props.fontSize || "16"}px !important;
    }
    div {
      margin-left: 0 !important;
      display: flex !important;
      justify-content: center;
    }
  }

  .sb-avatar__image {
    object-fit: none;
    object-position: center;
    object-fit: cover;
    margin: 3px;
    ${(props) =>
      props.borderColor &&
      css`
        border: ${props.borderSize || "3"}px solid ${props.borderColor};
      `}
  }

  .sb-avatar__text {
    span {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
  }
`;

export const LeftSection = styled.div`
  flex: 1;
  margin-right: 50px;
  margin-top: 5rem;

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

  section {
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 1.2rem 0 0.5rem;

      button {
        border: 0;
        background: none;
      }
    }
  }

  // mobile
  @media ${device.laptopM} {
    margin-right: 0;
    > header {
      display: none;
    }
  }
`;

export const RightSection = styled.aside`
  min-width: 320px;
  max-width: 380px;

  @media ${device.laptopM} {
    display: none;
  }

  h3 {
    margin-right: 10px;
    color: #333;
    font-size: 24px;
    font-weight: 300;

    margin: 0 0 20px;
  }

  button {
    margin: 0 auto;
    display: block;
    width: 100%;

    max-width: 600px;

    @media ${device.laptopM} {
      display: none;
    }
  }

  @media ${device.laptopM} {
    max-width: 100%;
    width: 100% !important;
    margin: 0 auto;

    h3 {
      color: #333;
      font-weight: 400;
      font-size: 22px;
    }
  }

  section {
    display: flex;
    flex-direction: row;
    margin-top: 20px;
    justify-content: space-between;

    // mobile
    @media ${device.laptopM} {
      display: none;
    }
  }
`;

export const Footer = styled.footer`
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 100 !important;
  height: 80px;
  width: 100%;
  background-color: #fff;
  display: none;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);

  button {
    max-width: 90%;
    margin: 0 10px 0 5px;
  }

  // mobile
  @media ${device.laptopM} {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;
