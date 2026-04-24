import { lighten, darken, desaturate } from "polished";
import Select from "react-select/async";
import styled, { css, ThemeContext } from "styled-components";

interface IContainerProps {
  error?: boolean;
}

interface ISelectProps {
  margin: string;
}

export const Container = styled.div<IContainerProps>`
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0px;
  flex: 1;

  ${(props) =>
    props.error &&
    css`
      height: 59px;
      max-height: 59px;
    `}
  &:last-of-type {
    margin: 0px;
  }

  .react-select2__control {
    ${(props) =>
      props.error &&
      css`
        border: 2px solid #ac3030 !important;
      `};
  }

  /* ICON ERROR */
  i {
    text-decoration: none;
    font-style: normal;

    position: absolute;
    align-self: flex-end;
    padding: 0.4rem 0.6rem 0rem 0.6rem;

    svg {
      font-size: 0.875rem;
      stroke-width: 3px;
      /* opacity: 0.9; */
      color: red;

      -webkit-transition: all 0.15s ease 0s;
      transition: all 0.15s ease 0s;

      &:hover {
        opacity: 1;
      }
    }
  }
`;

export const SelectComponent = styled(Select)<ISelectProps>`
  min-width: 200px;
  width: 100%;
  height: 38px;

  margin: ${(props) => props.margin || 0};
`;

export const customStyles = {
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isDisabled
      ? null
      : state.isSelected
      ? null
      : state.isFocused
      ? "hsla(0, 0%, 87.1%, 0.3)"
      : null,
    color: state.isDisabled
      ? "hsla(0, 0%, 0%, 0.3)"
      : state.isSelected
      ? "#0057FF"
      : "#1d253b",
    fontWeight: state.isSelected ? "600" : "400",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
  }),
  singleValue: (base: any, state: any) => ({
    ...base,
    padding: "8px 8px",
    borderRadius: 6,
    background: "#0057FF",
    color: "white",
    display: "flex",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    opacity: state.isDisabled ? "0.6" : "1",
  }),
  control: (base: any, state: any) => ({
    ...base,
    width: "100%",
    height: 57,
    border: state.isFocused ? "1px solid #00007d" : "2px solid #ebebeb",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    opacity: state.isDisabled ? "0.6" : "1",
    "&:hover": {
      border: "2px solid #ebebeb",
    },
  }),
  input: (base: any, state: any) => ({
    ...base,
    color: "#000",
    fontSize: "16px",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    "&:placeholder": {
      color: "red",
    },
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
  }),
  indicatorSeparator: (base: any) => ({
    backgroundColor: "transparent",
    span: {
      width: "1px",
      height: "1px",
      minWidth: "1px",
    },
  }),
  loadingIndicator: (base: any) => ({
    ...base,
    span: {
      width: "8px",
      height: "8px",
      minWidth: "8px",
    },
  }),

  dropdownIndicator: (base: any, state: any) => ({
    ...base,
    color: "#333",
  }),
  clearIndicator: (base: any) => ({
    ...base,
    color: "#c53030",
  }),
  menu: (provided: any, state: any) => ({
    ...provided,
    "z-index": "9999 !important",
    "box-shadow": "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.17)",
  }),
};

export const menuHeaderStyle = {
  padding: "8px 12px",
  background: "#fff",

  color: "hsla(0, 0%, 0%, 0.3)",
};

export const ErrorMessage = styled.span`
  margin-top: 1.5px;
  align-self: flex-start;
  display: flex;
  flex: 1 1;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: ${(props) => props.theme.error};
`;

export const OptionContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 8px 8px 8px;
  cursor: pointer;
  transition: background 0.2s;

  p {
    margin-left: 10px;
  }

  strong {
    color: #3b3b3b;
    font-size: 14px;
    font-style: italic;

    &:before {
      content: "-";
      margin: 0 5px;
    }
  }

  &:hover {
    background-color: #f0f0f0;
  }

  /* .sb-avatar__text {
    div {
      span {
        margin-top: 9px;
      }
    }
  } */
`;

export const ContainerValue = styled.div`
  min-width: 80%;
  display: flex;
  align-items: center;

  svg {
    width: 20px;
    height: 20px;
    margin: 0 11px 0 16px;
    color: #666360;
  }
`;
