import styled, { css } from "styled-components";

import Tooltip from "../Tooltip";

interface IContainerProps {
  isFocused: boolean;
  isFilled: boolean;
  isErrored: boolean;
  isLoading?: boolean;
}

export const Label = styled.p`
  color: #000 !important;
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
  align-items: flex-start;

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

  textarea {
    color: #000;
    flex: 1;
    background: transparent;
    border: 0;
    resize: none;
    &::placeholder {
      color: #666360;
    }

    &:disabled {
      cursor: not-allowed;
    }
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

export const Wrapper = styled.div`
  display: flex;
  align-items: flex-start !important;
  flex-direction: column;
  width: 100%;
  margin-left: 0 !important;
  margin-bottom: 0.65rem;
  text-align: left !important;
`;
