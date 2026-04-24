import { darken, lighten } from "polished";
import styled, { css } from "styled-components";

import { device } from "../../styles/devices";

export const CheckLabel = styled.label`
  flex-shrink: 1;
  margin: 0 0 0 0;
  padding-left: 1.8rem !important;
`;
export const Container = styled.div`
  /* min-height: 50px; */
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

  /* text-transform: uppercase; */
  label {
    margin-right: 0px;
    font-size: 1rem;

    &:after {
    }
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
        color: #00007d;
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
        width: 20px;
        height: 20px;

        border-radius: 4px;

        background: #fff;
        border: 1px solid #a2adb5;

        ${(props) =>
          props.error === "true" &&
          css`
            border: 2px solid #ac3030;
          `}
      }

      &:checked + ${CheckLabel}::after, &:not(:checked) + ${CheckLabel}::after {
        content: "✔";
        /* width: 10px; */
        /* height: 10px; */
        font-size: 1.375rem;
        color: #00007d;
        position: absolute;
        top: 0px;
        left: 2px;
        /* border-radius: 3px; */
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
  margin-bottom: 0.5rem !important;
  padding-left: 3px;
  margin-top: 0 !important;
`;
