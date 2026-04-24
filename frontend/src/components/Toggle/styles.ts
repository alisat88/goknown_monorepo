import styled, { css } from "styled-components";

interface IContainerProps {
  hasAlias?: boolean;
  disabled?: boolean;
}
interface ILabelProps {
  disabled?: boolean;
}

export const Container = styled.div<IContainerProps>`
  min-height: 38px; /*era 50px*/
  margin-bottom: 10px;
  display: flex;
  /* align-items: center; */
  justify-content: flex-start;

  flex-direction: ${(props) => (props.hasAlias ? "column" : "row")};

  ${(props) =>
    props.disabled &&
    css`
      opacity: 0.6;

      cursor: not-allowed;

      div {
        cursor: not-allowed;
      }
    `};
`;

export const Label = styled.p<ILabelProps>`
  font-size: 0.85rem !important;
  font-weight: bold !important;
  margin-bottom: 0.8rem !important;
  padding-left: 3px;
  margin-top: 0 !important;
  margin-right: 1rem;

  ${(props) =>
    props.disabled &&
    css`
      opacity: 0.8;
      pointer-events: not-allowed;
      cursor: not-allowed;
    `};
`;

export const Switch = styled.div`
  display: flex;
  align-items: flex-start;

  ${Label} {
    &:last-of-type {
      margin-left: 1rem;
    }
  }
`;
