import { format } from "date-fns";
import React, { useRef, useState, useEffect, useCallback } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { FiCalendar, FiX } from "react-icons/fi";

import { useField } from "@unform/core";

import { Container, Error, Label, Wrapper } from "../Input/styles";
import { Container as ContainerDate } from "./styles";

const DatePicker = ({ name, placeholderText, disabled, label, ...rest }) => {
  const datepickerRef = useRef(null);

  const { fieldName, registerField, defaultValue, error } = useField(name);

  const [date, setDate] = useState(defaultValue || null);

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: datepickerRef.current,
      path: "props.selected",
      clearValue: (ref) => {
        ref.clear();
      },
    });
  }, [fieldName, registerField]);

  return (
    <ContainerDate>
      <ReactDatePicker
        dateFormat="mm-dd-yyyy"
        ref={datepickerRef}
        selected={date}
        // locale={ptBR}
        onChange={(date) => setDate(date)}
        customInput={
          <Wrapper>
            {!!label && <Label>{label}</Label>}

            <Container>
              <input
                value={date ? format(date, "MM-dd-yyyy") : date}
                placeholder={placeholderText}
                disabled={disabled}
                error={error || rest.errorField}
                {...rest}
              />
              {(!!error || !!rest.errorField) && (
                <i>
                  <FiX />
                </i>
              )}

              <Error>{error || rest.errorField}</Error>
            </Container>
          </Wrapper>
        }
        {...rest}
      />
    </ContainerDate>
  );
};

export default DatePicker;

// CustomInput.defaultProps = {
//   disabled: false,
//   error: false,
//   placeholderText: "",
//   label: "",
//   icon: <FiCalendar />,
// };

// CustomInput.propTypes = {
//   onChange: PropTypes.func,
//   onClick: PropTypes.func,
//   onFocus: PropTypes.func,
//   disabled: PropTypes.bool,
//   error: PropTypes.bool,
//   placeholderText: PropTypes.string,
//   label: PropTypes.string,
//   value: PropTypes.string,
//   icon: PropTypes.node,
// };
