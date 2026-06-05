import { lighten, shade } from "polished";
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

    h1 {
      margin-bottom: 24px;
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
  background: url(${siginBackgroundImg}) no-repeat center;
  background-size: cover;
`;
