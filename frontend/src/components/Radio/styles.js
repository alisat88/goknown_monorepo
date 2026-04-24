import { darken, lighten } from "polished";
import styled, { css } from "styled-components";

import { device } from "../../styles/devices";

export const CheckLabel = styled.label`
  flex-shrink: 1;
  margin: 0 0 0 0;
`;
export const Container = styled.div`
  min-height: 38px; /*era 50px*/
  margin-bottom: 10px;
`;

export const Content = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: ${(props) =>
    props.columns ? props.columns : "1fr 1fr 1fr"};
  @media ${device.laptop} {
    grid-template-columns: ${(props) =>
      props.columns ? props.columns : "1fr 1fr"};
  }

  @media ${device.mobileM} {
    grid-template-columns: 1fr;
  }

  ${(props) =>
    props.direction === "column" &&
    css`
      grid-template-columns: 1fr;
    `}

  /* text-transform: uppercase; */
  label {
    margin-right: 0px;
    font-size: 1rem;
    input {
      position: absolute;
      left: -9999px;

      &:checked + ${CheckLabel}, &:not(:checked) + ${CheckLabel} {
        position: relative;
        padding: 0 0 0 23px;
        cursor: pointer;
        line-height: 20px;
        display: flex;
      }

      &:checked + ${CheckLabel} {
        color: #353b3f;
      }

      &:not(:checked) + ${CheckLabel} {
        color: #73818c;
      }

      &:checked
        + ${CheckLabel}::before,
        &:not(:checked)
        + ${CheckLabel}::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 16px;
        height: 16px;

        border-radius: 100%;

        background: #fff;
        border: 1px solid #a2adb5;

        ${(props) =>
          props.error === "true" &&
          css`
            border: 1px solid #ac3030;
          `}
      }

      &:checked + ${CheckLabel}::after, &:not(:checked) + ${CheckLabel}::after {
        content: "";
        width: 8px;
        height: 8px;
        background: #00007d;
        position: absolute;
        top: 5px;
        left: 5px;
        border-radius: 100%;
        -webkit-transition: all 0.2s ease;
        transition: all 0.2s ease;
      }

      &:not(:checked) + ${CheckLabel}::after {
        opacity: 0;
        -webkit-transform: scale(0);
        transform: scale(0);
      }
      &:checked + ${CheckLabel}::after {
        opacity: 1;
        -webkit-transform: scale(1);
        transform: scale(1);
      }

      &:disabled + ${CheckLabel} {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  }
`;

export const ErrorMessage = styled.span`
  margin-top: 1.5px;
  align-self: flex-start;
  display: flex;
  flex: 1 1;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #ac3030;
`;

export const Label = styled.p`
  font-size: 0.85rem !important;
  font-weight: bold !important;
  margin-bottom: 0.2rem !important;
  padding-left: 3px;
  margin-top: 0 !important;
`;
