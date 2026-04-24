import React, { useRef, useEffect } from "react";
import { FiUser } from "react-icons/fi";
import { IconBaseProps } from "react-icons/lib";
import { components, OptionTypeBase, Props as SelectProps } from "react-select";

import { useField } from "@unform/core";

import { Avatar } from "../../styles/global";
import {
  Container,
  SelectComponent,
  customStyles,
  menuHeaderStyle,
  ErrorMessage,
  OptionContent,
  ContainerValue,
} from "./styles";

interface IProps extends SelectProps<OptionTypeBase> {
  type: "normal" | "avatar";
  name: string;
  placeholder?: string;
  errorField?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<React.PropsWithChildren<IconBaseProps>>;
  isClearable?: boolean;
  fill?: boolean;
  isLoading?: boolean;
  noOptionsMessage?(): string;
  loadingMessage?(): string;
  options: any;
}

const Select: React.FC<React.PropsWithChildren<IProps>> = ({
  name,
  errorField,
  searchable,
  icon: Icon,
  type = "normal",
  disabled,
  options,
  ...rest
}) => {
  const selectAsyncRef = useRef(null);
  const { fieldName, defaultValue, registerField, error } = useField(name);

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: selectAsyncRef.current,
      getValue: (ref) => {
        if (rest.isMulti) {
          if (!ref.select.state.value) {
            return [];
          }
          // return ref.select.state.value.map(option => option.value)
        } else {
          if (!ref.select.state.value) {
            return "";
          }
          return ref.select.state.value.value;
        }
      },
      setValue: (ref, value) => {
        ref.select.select.setValue(value);
      },
      clearValue(ref) {
        ref.select.select.setValue();
      },
    });
  }, [fieldName, registerField, rest.isMulti]);

  const MenuList = (props: any) => {
    return (
      <components.MenuList {...props}>
        {/* {!props.isLoading && (
          <div style={menuHeaderStyle}>Please enter at least 3 characters</div>
        )} */}
        {props.children}
      </components.MenuList>
    );
  };

  const OptionAvatar = (props: any) => {
    const { innerProps, inneRef } = props;
    return (
      <OptionContent ref={inneRef} {...innerProps}>
        <Avatar
          width={36}
          height={36}
          fontSize={14}
          name={props.data.label}
          src={props.data.avatar_url}
          round
          alt={props.data.label}
        />

        <p>{props.data.label}</p>
        <strong>{props.data.email}</strong>

        {/* <components.Option {...props} /> */}
      </OptionContent>
    );
  };

  const defaultOption = (props: any) => {
    return <components.Option {...props} />;
  };

  const ValueContainer = (props: any) => {
    return (
      <ContainerValue>
        {Icon ? <Icon /> : <FiUser />}
        <components.ValueContainer {...props} />
      </ContainerValue>
    );
  };
  const customOption = type === "avatar" ? OptionAvatar : defaultOption;
  return (
    <Container error={errorField || !!error}>
      <SelectComponent
        error={error}
        styles={customStyles}
        isSearchable={true}
        ref={selectAsyncRef}
        classNamePrefix="react-select2"
        cacheOptions
        defaultOptions
        defaultValue={defaultValue}
        menuPortalTarget={document.querySelector("body")}
        options={options}
        // isDisabled
        components={{ MenuList, Option: customOption, ValueContainer }}
        {...rest}
      />

      {!!errorField && <ErrorMessage>{error || errorField}</ErrorMessage>}
    </Container>
  );
};

Select.defaultProps = {
  isMulti: false,
  searchable: false,
  isClearable: false,
  fill: true,
  noOptionsMessage: () => "No option",
  loadingMessage: () => "Loading...",
  disabled: false,
  errorField: false,
  placeholder: "Select...",
  isLoading: false,
  type: "normal",
};

export default Select;
