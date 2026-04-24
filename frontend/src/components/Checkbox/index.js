// eslint-disable-next-line import/no-extraneous-dependencies
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

import { useField } from "@unform/core";

import { Container, CheckLabel, Content, ErrorMessage, Label } from "./styles";

export default function Checkbox({
  name,
  options,
  color,
  errorField,
  disabled,
  handleSelected,
  label,
  columns,
}) {
  const inputRefs = useRef([]);
  const { fieldName, registerField, defaultValue, error } = useField(name);

  useEffect(() => {
    registerField({
      name: fieldName,
      path: "value",
      ref: inputRefs.current,
      getValue(refs) {
        return refs
          .filter((ref) => ref.checked)
          .map((ref) => (ref.checked ? ref.value : null));
      },
      setValue: (refs, values) => {
        refs.forEach((ref) => {
          if (values[0] && values[0].value === Number(ref.value)) {
            ref.checked = true;
          } else {
            ref.checkd = false;
          }

          if (values.includes(ref.value.value)) {
            ref.checked = true;
          }

          if (values.includes(ref.value)) {
            ref.checked = true;
          }
        });
      },

      clearValue: (refs) => {
        refs.forEach((ref) => {
          ref.checked = false;
        });
      },
    });
  }, [fieldName, registerField]);

  return (
    <Container>
      {label && <Label>{label}</Label>}
      <Content
        columns={columns}
        color={color}
        error={error ? "true" : "false" && errorField ? "true" : "false"}
      >
        {options.map((option, index) => (
          <label key={option.value}>
            <input
              ref={(elRef) => (inputRefs.current[index] = elRef)}
              type="checkbox"
              id={`checkbox_id_${name}_${index}`}
              name={fieldName}
              value={option.value}
              defaultChecked={
                defaultValue
                // ? defaultValue.find((value) => value === option.id)
                // : null
              }
              disabled={disabled}
              onClick={(e) =>
                disabled
                  ? null
                  : handleSelected({ e, ...option, checked: e.target.checked })
              }
            />

            <CheckLabel htmlFor={`checkbox_id_${name}_${index}`}>
              {option.label}
            </CheckLabel>
          </label>
        ))}
      </Content>
      <ErrorMessage>{error || errorField}</ErrorMessage>
    </Container>
  );
}

Checkbox.defaultProps = {
  color: "primary",
  columns: "1fr 1fr 1fr",
  disabled: false,
  handleSelected: () => null,
};

Checkbox.propTypes = {
  name: PropTypes.string.isRequired,
  errorField: PropTypes.string,
  color: PropTypes.string,
  disabled: PropTypes.bool,
  columns: PropTypes.string,
  label: PropTypes.string,
  handleSelected: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any,
      label: PropTypes.string,
      checked: PropTypes.bool,
    }).isRequired
  ),
};
