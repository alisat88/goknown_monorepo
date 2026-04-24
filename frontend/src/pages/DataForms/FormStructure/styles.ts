import styled, { css } from "styled-components";

import { Container as DatePicker } from "../../../components/DatePicker/styles";
import {
  Container as Input,
  Wrapper as InputContainer,
} from "../../../components/Input/styles";
import { Container as Radio } from "../../../components/Radio/styles";
import { Container as TextArea } from "../../../components/TextArea/styles";
import { Container as Toggle } from "../../../components/Toggle/styles";
import { device } from "../../../styles/devices";

export const ContentBuilder = styled.main`
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  margin-top: 1rem;

  // mobile
  @media ${device.laptopM} {
    margin: -3rem auto;
    padding: 0 10px;
    flex-direction: column-reverse;
  }
`;
export const FormBuilder = styled.div`
  flex: 1;
  margin-right: 50px;

  // mobile
  @media ${device.laptopM} {
    margin-top: 3.5rem;
  }

  > header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    button {
      width: 200px !important;
    }

    h1 {
      color: #f0f2f5;
      font-weight: 200;
      font-size: 36px;

      // mobile
      @media ${device.laptopM} {
        font-size: 22px;
        font-weight: 400;
        margin-top: 15px;

        button {
          width: 150px !important;
        }
      }
    }
  }
  }

  // mobile
  @media ${device.laptopM} {
    margin-right: 0;
    > header {
      display: none;
    }
  }
`;

interface IRigthMenuProps {
  opened: boolean;
}

export const RigthMenu = styled.div<IRigthMenuProps>`
  position: fixed;
  top: 0;
  right: 0;
  min-width: 30rem;
  height: 100%;
  overflow: auto;
  background: #fff;
  padding: 1rem;
  box-shadow: -1px 0px 3px 0px rgba(0, 0, 0, 0.5);
  transition: transform ease-in-out 0.2s;
  ${(props) =>
    !props.opened
      ? css`
          transform: translateX(30rem);
        `
      : css`
          transform: translateX(0);
        `}
  header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    border-bottom: 1px solid #b3b3b3;
    h1 {
      display: flex;
      align-items: center;
      font-weight: 400;
      font-size: 1.6rem;
      svg {
        width: 1.8rem;
        height: 1.8rem;
        margin-right: 0.65rem;
      }
    }

    button {
      background: transparent !important;
      border: none !important;
      margin: 0 1rem 0 0;
      transition: opacity 0.2s ease-in-out;
      svg {
        stroke-width: 1px;
        width: 2rem;
        height: 2rem;
      }
      &:hover {
        opacity: 0.4;
      }
    }
  }

  form {
    margin-top: 2rem;

    section {
      display: flex;
      margin-bottom: 0.5rem;
      ${InputContainer} {
        &:first-of-type {
          padding-right: 0.5rem;
        }
      }
      p {
        font-weight: bold;
        margin-right: 0.6rem;
        font-size: 0.85rem;
      }
    }
  }
`;

interface IListProps {
  isDraggingOver?: boolean;
  innerRef?: any;
}

export const List = styled.div<IListProps>`
  width: 100%;
  /* height: 100%; */
  border: 1px ${(props) => (props.isDraggingOver ? "dashed #000" : "none")};
  /* background: #fff; */
  padding: 0.5rem;
  border-radius: 3px;
  flex: 0 0 150px;
  font-family: sans-serif;
`;

interface IItemProps {
  isDragging?: boolean;
  isSelected?: boolean;
  isErrored?: boolean;
  innerRef?: any;
}

export const Item = styled.div<IItemProps>`
  display: flex;
  user-select: none;
  padding: 0.5rem;
  margin: 0 0 0.5rem 0;
  align-items: baseline;

  line-height: 1.5;
  border-radius: 3px;
  background: #fff;
  border: 1px ${(props) => (props.isDragging ? "dashed #4099ff" : "solid #ddd")};
  svg {
    margin-right: 0.6rem;
  }
`;

export const ItemForm = styled(Item)`
  background: none;
  /* position: relative !important; */
  margin: 0 !important;
  line-height: 1;
  transition: border ease-in-out 0.1s;

  border: 2px
    ${(props) => (props.isDragging ? "dashed #4099ff" : "solid #F0F2F5")};

  ${(props) =>
    props.isSelected &&
    css`
      background-color: #99c9ff;
      border: 2px solid #4099ff;
    `}

  ${(props) =>
    props.isErrored &&
    css`
      border: 2px solid #ac3030;
    `}

  &:hover {
    cursor: pointer;
    border: 2px solid #4099ff;
  }
`;

export const ItemActions = styled.div`
  right: 0;
  top: 0;
  min-width: 4rem;
  /* position: absolute !important; */
  margin: 0 0 0 auto;
  button {
    border: none !important;
    background: transparent !important;
    padding: 0.5rem;
    transition: transform 0.2s ease-in-out;

    svg {
      padding: 0;
      margin: 0;
      width: auto;
    }

    &:nth-child(2) {
      color: #ac3030;
    }
    &:hover {
      transform: scale(1.2);
    }

    &:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed;
      &:hover {
        transform: scale(1);
      }
    }
  }
`;

export const Kiosk = styled(List)`
  /* position: absolute; */
  top: 0;
  right: 0;
  bottom: 0;
  /* width: 200px; */

  @media ${device.laptopM} {
    flex-direction: row;
    display: flex;
    max-height: 90px;
    ${Item} {
      height: 90px;
      margin-right: 0.65rem;
      width: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-content: center;
      align-items: center;

      svg {
        padding: 0;
        margin: 0;
        transform: scale(2);
      }
    }
  }
`;

export const ContentDrag = styled.div`
  /* margin-right: 200px; */
`;

export const ContainerDrag = styled(List)`
  margin: 0.5rem 0.5rem 1.5rem;
  /* background: #ccc; */
  form {
    width: 100%;
    height: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;

    h1 {
      margin-bottom: 24px;

      text-align: left;

      font-weight: 200;
      font-size: 36px;
      /* @media ${device.laptopM} {
        display: none;
      } */
    }
    p {
      text-align: left;
      margin-top: 0.65rem !important;
    }
    h3 {
      text-align: left;
      /* margin-top: 1rem; */
      font-weight: bold;
      font-size: 1.2rem;
      color: #333 !important;
    }

    input,
    textarea,
    ${Toggle}, ${Radio},${DatePicker} {
      pointer-events: none;
    }

    ${Input} {
      margin-bottom: 0 !important;
      div {
        margin-bottom: 0 !important;
      }
    }

    ${TextArea} {
      margin-left: 0 !important;
      margin-bottom: 0 !important;
    }
    ${DatePicker} {
      margin-left: 0 !important;
    }

    br {
      display: block;
      padding: 0.5rem 0;
    }

    > section {
      align-items: center;
      margin-top: 1rem;
      position: relative;
      min-height: 170px;
      padding-left: 60px;
      display: flex;

      > svg {
        padding-left: 20px;
      }
    }

    div {
      /* display: flex; */
      /* margin: 20px 0; */
      /* align-items: center; */

      /* & + div {
        margin-left: 20px;
      } */
    }

    footer {
      display: flex;
      flex-direction: column;
      flex: 1;
      align-items: center;
      justify-content: flex-end;
    }
  }
`;

export const Clone = styled(Item)`
  svg {
    margin-right: 0.6rem;
  }
  /* + div {
    display: none !important;
  } */
`;

export const Notice = styled.div`
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  padding: 0.5rem;
  margin: 0 0.5rem 0.5rem;
  border: 1px solid transparent;
  line-height: 1.5;
  color: #aaa;
`;

export const Handle = styled.div`
  display: flex;
  align-items: flex-start;
  align-content: center;
  user-select: none;
  margin: -0.5rem 0rem -0.5rem -0.5rem;
  padding: 0.5rem;
  line-height: 1.5;
  border-radius: 3px 0 0 3px;
  /* background: #fff; */
  /* border-right: 1px solid #ddd; */
  color: #000;

  svg {
    opacity: 0.5;
  }
`;

export const RigthSection = styled.aside`
  min-width: 320px;
  max-width: 380px;

  /* @media ${device.laptopM} {
    display: none;
  } */

  h3 {
    margin-right: 10px;
    color: #333;
    font-size: 24px;
    font-weight: 300;

    margin: 0 0 20px;
  }

  button {
    margin: 0 auto;
    display: block;
    width: 100%;

    max-width: 600px;

    @media ${device.laptopM} {
      display: none;
    }
  }

  @media ${device.laptopM} {
    max-width: 100%;
    width: 100% !important;
    margin: 0 auto;

    h3 {
      color: #333;
      font-weight: 400;
      font-size: 22px;
    }
  }

  section {
    display: flex;
    flex-direction: row;
    margin-top: 20px;
    justify-content: space-between;

    // mobile
    @media ${device.laptopM} {
      display: none;
    }
  }
`;

export const GroupProperties = styled.section`
  display: flex;
  flex-direction: column;
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0 0 0.5rem;
    border-bottom: 1px solid #ccc;
    width: 100%;
    h3 {
      margin-top: 1.5rem;
    }
    button {
      display: flex;
      margin: 0;
      background: #00007d !important;
      color: #f0f2f5;
      font-size: 0.8rem;
      padding: 0 0.5rem;
      border-radius: 4px;
      height: 2rem;
      align-items: center;
      transition: opacity 0.2s ease-in-out;
      svg {
        width: 1.2rem;
        height: 1.2rem;
      }
      &:hover {
        opacity: 0.8;
      }
    }
  }

  ul {
    list-style: none;
    padding: 1rem 0;

    li {
      display: flex;

      ${Input} {
        padding: 8px !important;
      }

      ${InputContainer} {
        margin-right: 0.65rem;
      }
    }
  }
`;
