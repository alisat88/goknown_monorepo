import styled, { css } from "styled-components";

import Tooltip from "../Tooltip";

interface IContainerProps {
  isFocused: boolean;
  isFilled: boolean;
  isErrored: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export const Label = styled.p`
  font-size: 0.85rem !important;
  font-weight: bold !important;
  margin-bottom: 0.3rem !important;
  padding-left: 3px;
  margin-top: 0 !important;
`;

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
    (props.isLoading || props.isDisabled) &&
    css`
      opacity: 0.6;
      cursor: not-allowed;
    `}

  input {
    color: #000;
    flex: 1;
    background: transparent;
    border: 0;
    &::placeholder {
      color: #666360;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  svg {
    margin-right: 16px;
    height: 20px;
    width: 20px;
    color: #333;
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

export const Info = styled(Tooltip)`
  height: 20px;
  margin-left: 16px;
  svg {
    margin: 0;
  }

  span {
    background: #00007d;
    color: #fff;

    &:before {
      border-color: #00007d transparent;
    }
  }
`;

export const Wrapper = styled.div`
  display: flex;
  align-items: flex-start !important;
  flex-direction: column;
  width: 100%;
  margin-left: 0 !important;
  margin-bottom: 0.65rem;
  text-align: left !important;
`;
