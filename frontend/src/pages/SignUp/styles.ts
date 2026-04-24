import { shade } from "polished";
import styled, { keyframes } from "styled-components";

import sigupBackgroundImg from "../../assets/sign-up-background.jpg";

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

const appearFromRight = keyframes`
  from{
    opacity: 0;
    transform: translateX(50px);
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

  animation: ${appearFromRight} 1s;
  form {
    margin: 80px 0;
    width: 340px;
    text-align: center;

    h1 {
      margin-bottom: 24px;
    }

    a {
      color: #f4ede8;
      display: block;
      margin-top: 24px;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: ${shade(0.2, "#f4ede8")};
      }
    }
  }

  > a {
    color: #7f3e8f;
    display: block;
    margin-top: 24px;
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
  background: url(${sigupBackgroundImg}) no-repeat center;
  background-size: cover;
`;

export const WelcomeContent = styled.div`
  margin: 40px 0;
  width: 90%;
  max-width: 600px;
  height: 60vh;
  overflow-y: auto;
  padding: 0 20px 20px 0;
  text-align: left;
  position: relative;

  h1 {
    text-align: center;
    margin-bottom: 24px;
    color: #333;
  }

  p {
    margin-bottom: 16px;
    line-height: 1.6;
    color: #444;
  }

  ul {
    margin-bottom: 16px;
    padding-left: 20px;

    li {
      margin-bottom: 8px;
      line-height: 1.5;
      color: #444;
    }
  }

  strong {
    color: #7f3e8f;
  }

  .footer-info {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    font-size: 14px;
    color: #666;

    a {
      color: #7f3e8f;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .enable-button {
      display: block;
      margin: 20px auto 0;
      padding: 10px 20px;
      background-color: #7f3e8f;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: ${shade(0.2, "#7f3e8f")};
      }
    }
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #7f3e8f;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${shade(0.2, "#7f3e8f")};
  }
`;

export const EulaContainer = styled.div`
  margin: 16px 0;
  text-align: left;

  .checkbox-wrapper {
    display: flex;
    align-items: flex-start;

    input[type="checkbox"] {
      appearance: none;
      background-color: #fff;
      margin: 0;
      width: 18px;
      height: 18px;
      border: 2px solid #999;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      margin-right: 8px;
      margin-top: 2px;
      position: relative;
      flex-shrink: 0;
      transition: all 0.2s;

      &:checked {
        background-color: #7f3e8f;
        border-color: #7f3e8f;
      }

      &:checked::after {
        content: "";
        width: 5px;
        height: 10px;
        position: absolute;
        border-right: 2px solid white;
        border-bottom: 2px solid white;
        transform: rotate(45deg) translate(-1px, -1px);
      }

      &:hover {
        border-color: #7f3e8f;
      }
    }

    label {
      cursor: pointer;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }
  }

  button {
    background: transparent;
    border: none;
    color: #7f3e8f;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    font-size: 14px;
    transition: color 0.2s;

    &:hover {
      color: ${shade(0.2, "#7F3E8F")};
    }
  }
`;
