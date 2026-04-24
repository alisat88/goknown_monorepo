import { lighten } from "polished";
import styled, { css } from "styled-components";

export const Container = styled.div<{
  disabled?: boolean;
  color?: "green" | "blue";
}>`
  background: ${(props) => (props.color === "blue" ? "#00007d" : "#53bf99")};
  width: 180px;
  height: 180px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
  transition-property: box-shadow, color;
  transition-duration: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f0f2f5;
  transition: filter ease-in-out 0.2s;
  svg {
    width: 40px;
    height: 40px;
    stroke-width: 1px;
    color: #f0f2f5;
    transition: color 0.2s;
  }

  p {
    margin-top: 10px;
    color: #f0f2f5;
    font-family: "Poppins";
    font-size: 18px;
    transition: filter 0.2s;
  }

  &:hover {
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 5px 35px rgba(0, 0, 0, 0.05),
      0 5px 10px rgba(0, 0, 0, 0.01);
    filter: brightness(0.9);
  }

  ${(props) =>
    props.disabled &&
    css`
      background: ${lighten(0.2, "#53bf99")};
      cursor: not-allowed;
      &:hover {
        filter: none;
        box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0);
      }
    `}
`;
