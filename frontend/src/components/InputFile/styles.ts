import styled, { css } from "styled-components";

import Tooltip from "../Tooltip";

interface IContainerProps {
  isFocused: boolean;
  isFilled: boolean;
  isErrored: boolean;
  isLoading?: boolean;
}

export const Container = styled.div<IContainerProps>`
  background: #fff;
  border-radius: 6px;

  padding: 16px;
  width: 100%;

  color: #666360;
  border: 2px solid #ebebeb;

  display: flex;
  align-items: center;

  & + div {
    margin-top: 8px;
  }

  ${(props) =>
    props.isErrored &&
    css`
      border: 2px solid #ac3030;
    `}

  ${(props) =>
    props.isFocused &&
    css`
      color: #00007d;
      border: 2px solid #00007d;
    `}

  ${(props) =>
    props.isFilled &&
    css`
      color: #00007d;
    `}

  ${(props) =>
    props.isLoading &&
    css`
      opacity: 0.6;
      cursor: not-allowed;
    `}

  input {
    display: none;
    /* color: #000;
    flex: 1;
    background: transparent;
    border: 0;
    &::placeholder {
      color: #666360;
    }

    &:disabled {
      cursor: not-allowed;
    } */
  }

  strong {
    flex: 1;
  }

  a {
    text-decoration: none;
    font-size: 16px;
    color: #c53030;
    transition: 0.2s;
    &:hover {
      opacity: 0.7;
    }
  }

  button {
    outline: none;
    border: none;
    background: none;
    color: #666360;
    width: 100%;
    text-align: start;
  }

  svg {
    margin-right: 16px;
  }
`;

export const Error = styled(Tooltip)`
  height: 20px;
  margin-left: 16px;
  svg {
    margin: 0;
  }

  span {
    background: #c53030;
    color: #fff;

    &:before {
      border-color: #c53030 transparent;
    }
  }
`;
