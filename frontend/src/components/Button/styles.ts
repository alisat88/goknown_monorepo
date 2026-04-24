import { shade } from "polished";
import styled from "styled-components";

interface IContainerProps {
  color?: "primary" | "secondary" | "accent" | "red";
}

const buttonsColor = {
  primary: `#00007d`,
  secondary: `#7F3E8F`,
  accent: `#53BF99`,
  red: "#E65D5E",
};

export const Container = styled.button<IContainerProps>`
  background: ${(props) => buttonsColor[props.color || "primary"]};
  height: 56px;
  border-radius: 6px;
  border: 0;
  padding: 0 16px;
  color: #fff;
  width: 100%;
  margin-top: 16px;
  font-weight: 600;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  div {
    margin: 0 auto;
  }

  svg {
    margin-right: 8px;
  }

  &:hover {
    background: ${(props) =>
      shade(0.2, buttonsColor[props.color || "primary"])};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    &:hover {
      background: ${(props) => buttonsColor[props.color || "primary"]};
    }
  }
`;
