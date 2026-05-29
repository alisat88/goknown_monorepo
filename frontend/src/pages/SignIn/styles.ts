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

export const VerificationCard = styled.form`
  width: 360px;
  margin: 58px 0 0;
  padding: 26px;
  border: 1px solid rgba(83, 191, 153, 0.24);
  border-radius: 18px;
  background: linear-gradient(
    145deg,
    rgba(12, 24, 54, 0.9),
    rgba(2, 8, 23, 0.78)
  );
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.26);
  color: #f8fafc;
  text-align: left;

  > svg {
    width: 42px;
    height: 42px;
    padding: 10px;
    border-radius: 14px;
    color: #8be7d7;
    background: rgba(83, 191, 153, 0.13);
  }

  h1 {
    margin: 18px 0 8px;
    color: #f8fafc;
    font-size: 26px;
    font-weight: 800;
    line-height: 1.15;
  }

  label {
    display: block;
    margin-top: 22px;
    color: #c9d6e5;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  input {
    width: 100%;
    height: 52px;
    margin-top: 9px;
    padding: 0 16px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.86);
    color: #f8fafc;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.04em;

    &::placeholder {
      color: #66788f;
    }

    &:focus {
      border-color: rgba(83, 191, 153, 0.58);
      box-shadow: 0 0 0 3px rgba(83, 191, 153, 0.14);
    }
  }
`;

export const VerificationHelper = styled.p`
  margin: 0;
  color: #98a8bc;
  font-size: 14px;
  line-height: 1.55;
`;

export const VerificationError = styled.div`
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(230, 93, 94, 0.34);
  border-radius: 12px;
  background: rgba(230, 93, 94, 0.12);
  color: #ffd7d7;
  font-size: 13px;
  line-height: 1.45;
`;

export const VerificationActions = styled.div`
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 12px;
  margin-top: 18px;

  > button:first-child {
    height: 56px;
    margin-top: 16px;
    border: 1px solid rgba(83, 191, 153, 0.26);
    border-radius: 6px;
    background: rgba(83, 191, 153, 0.1);
    color: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 700;
    transition: background 0.2s, border-color 0.2s;

    &:hover {
      background: rgba(83, 191, 153, 0.18);
      border-color: rgba(83, 191, 153, 0.42);
    }
  }
`;

export const Background = styled.div`
  flex: 1;
  background: url(${siginBackgroundImg}) no-repeat center;
  background-size: cover;
`;
