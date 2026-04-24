import styled, { css } from "styled-components";

interface IContainerProps {
  isErrored?: boolean;
  columns: string;
}

export const Container = styled.div<IContainerProps>`
  display: grid;
  grid-template-columns: ${(props) => props.columns};
  gap: 16px;
  margin: 16px 0;

  p {
    grid-column: 1/-1;
    margin-bottom: 8px;
    font-weight: 500;
    color: #666;
  }

  div {
    display: flex;
    align-items: center;

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
      position: relative;
      flex-shrink: 0;

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
    }

    label {
      cursor: pointer;
      font-size: 14px;
      color: #666;
    }
  }

  span {
    color: #c53030;
    margin-left: 8px;
    font-size: 12px;
  }

  ${(props) =>
    props.isErrored &&
    css`
      border-color: #c53030;
    `}

  a {
    color: #7f3e8f;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;
