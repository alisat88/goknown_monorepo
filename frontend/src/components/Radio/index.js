// eslint-disable-next-line import/no-extraneous-dependencies
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

import { useField } from "@unform/core";

import { Label } from "../Input/styles";
import { Container, Content, CheckLabel, ErrorMessage } from "./styles";

export default function Radio({
  name,
  options,
  errorField,
  disabled,
  handleSelected,
  color,
  columns,
  label,
  direction,
}) {
  const inputRefs = useRef([]);
  const { fieldName, registerField, defaultValue, error } = useField(name);

  useEffect(() => {
    registerField({
      name: fieldName,
      path: "value",
      ref: inputRefs.current,
      getValue(refs) {
        const checked = refs.find((ref) => ref.checked);

        return checked ? checked.value : null;
      },
      setValue(refs, value) {
        const item = refs.find(
          (ref) => ref.value === value || ref.label === ref.value
        );

        if (item) {
          item.checked = true;
        }
      },
      clearValue(refs) {
        refs.forEach((refs) => (refs.checked = false));
      },
    });
  }, [fieldName, registerField]);

  return (
    <Container>
      {label && <Label>{label}</Label>}
      <Content
        direction={direction}
        columns={columns}
        color={color}
        error={error ? "true" : "false" && errorField ? "true" : "false"}
      >
        {options.map((option, index) => (
          <label key={option.label}>
            <input
              ref={(elRef) => (inputRefs.current[index] = elRef)}
              type="radio"
              id={`${fieldName}_${index}`}
              name={fieldName}
              value={option.label}
              defaultChecked={defaultValue === option.label}
              disabled={option.disabled || disabled}
              onClick={(e) => handleSelected(option)}
            />

            <CheckLabel htmlFor={`${fieldName}_${index}`}>
              {option.label}
            </CheckLabel>
          </label>
        ))}
      </Content>
      <ErrorMessage>{error || errorField}</ErrorMessage>
    </Container>
  );
}

Radio.defaultProps = {
  color: "primary",
  disabled: false,
  handleSelected: () => {},
  direction: "row",
};

Radio.propTypes = {
  name: PropTypes.string.isRequired,
  errorField: PropTypes.string,
  label: PropTypes.string,
  color: PropTypes.string,
  columns: PropTypes.string,
  disabled: PropTypes.bool,
  handleSelected: PropTypes.func,
  direction: PropTypes.oneOf(["row", "column"]),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any,
      label: PropTypes.string,
    }).isRequired
  ),
};
