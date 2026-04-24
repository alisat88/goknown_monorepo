import { shade } from "polished";
import styled, { css } from "styled-components";

interface IContainerProps {
  isExpanded: boolean;
  isDisabled: boolean;
  hasValueToSubmit: boolean;
}

interface IContentProps {
  isExpanded: boolean;
}

export const Container = styled.div<IContainerProps>`
  position: absolute;
  margin: auto;

  left: 0;
  /* right: 100%; */
  z-index: 1000 !important;
  background-color: ${(props) => (props.isExpanded ? "#ac3030" : "#53bf99")};
  border-radius: 50%;
  width: 60px;
  max-width: 60px;
  height: 60px;
  text-align: center;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  overflow: hidden;

  transition: all 0.2s 0.45s, height 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.25s,
    max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.35s,
    width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.35s;

  ${(props) =>
    props.isExpanded &&
    css`
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.17);
      width: 100%;
      height: 60px;
      max-width: 600px;
      border-radius: 6px;
      padding: 0;
      /* -webkit-transition: all 0.2s,
        max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s, height 0.3s ease 0.25s; */
      transition: all 0.2s, max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
        height 0.3s ease 0.25s;

      ${props.hasValueToSubmit &&
      css`
        background-color: #53bf99;
      `}
    `}

  > span {
    cursor: pointer;
    width: 60px;
    min-width: 60px;
    height: 60px;

    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    line-height: 60px;
    font-weight: bold;
    transform: rotate(0deg);
    transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);

    div {
      margin-left: 0;
    }

    svg {
      width: 24px;
      height: 24px;
      color: #f0f0f0;
    }

    ${(props) =>
      props.isExpanded &&
      css`
        transform: rotate(585deg);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      `}

    ${(props) =>
      props.hasValueToSubmit &&
      css`
        transform: rotate(360deg);
      `}
  }

  ${({ isDisabled }) =>
    isDisabled &&
    css`
      cursor: not-allowed;
      opacity: 0.5;
      pointer-events: none;
    `}
`;

export const Content = styled.div<IContentProps>`
  transform: translateX(100%);
  width: 100%;
  height: 100%;
  opacity: 0;
  text-align: left;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s 0.2s;

  color: #000;
  background-color: #fff;
  width: 100%;
  height: 100%;
  padding: 10px 0;
  box-sizing: border-box;

  ${(props) =>
    props.isExpanded &&
    css`
      transform: translateX(0px);
      opacity: 1;
      transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.05s, opacity 0s;
    `}

  header {
    background: #53bf99;
  }

  > div {
    width: 100%;
    background: #fff;
    /* padding: 20px; */
  }
`;
