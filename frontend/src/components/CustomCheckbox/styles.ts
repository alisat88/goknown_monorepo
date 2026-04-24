import styled from "styled-components";

export const Container = styled.div`
  /* margin: 0 !important; */

  input {
    overflow: hidden;
    white-space: nowrap;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    position: absolute;
  }
`;

interface IProps {
  checked: any;
}
export const StyledCheckbox = styled.label<IProps>`
  width: 23px;
  height: 23px;
  margin-right: 6px;
  border-radius: 50%;
  background: #f6f6f6;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    display: ${(props) => (props.checked ? "flex" : "none")};
    filter: invert(75%) sepia(11%) saturate(6042%) hue-rotate(30deg)
      brightness(105%) contrast(68%);
  }
`;
