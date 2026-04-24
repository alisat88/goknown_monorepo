import React, {
  useEffect,
  useRef,
  InputHTMLAttributes,
  useState,
  useCallback,
} from "react";

import { useField, SubmitHandler, FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import CheckIcon from "../../assets/tick.svg";
import { Container, StyledCheckbox } from "./styles";

/**
 * This example renders one checkbox. If you want to render multiple options,
 * check the other checkbox example, or adapt this one.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
 */

interface IProps {
  name: string;
  label?: string;
  value?: string;
  onClick?(): void;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & IProps;

export function CustomCheckbox({ name, value, label, ...rest }: InputProps) {
  const inputRef = useRef<any>(null);
  const { fieldName, defaultValue, registerField, error } = useField(name);

  const [checked, setChecked] = useState(defaultValue === value);

  const defaultChecked = defaultValue === value;

  const handleCheckboxChange = useCallback(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.checked = !checked;
      console.log(inputRef.current.checked);
    }
    setChecked(!checked);
  }, [checked, inputRef]);

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: inputRef,
      getValue: (ref) => {
        return ref.current.checked;
      },
      clearValue: (ref: any) => {
        /**
         * If you want to change the default checked for false or true,
         * you can do so here. In this example, when resetting the form,
         * the checkbox goes back to its initial state.
         */
        setChecked(defaultChecked);

        ref.current.checked = defaultChecked;
      },
      setValue: (ref, value) => {
        setChecked(value as boolean);

        // eslint-disable-next-line no-param-reassign
        ref.current.checked = value;
      },
    });
  }, [defaultChecked, defaultValue, fieldName, registerField]);

  return (
    <Container onClick={handleCheckboxChange}>
      <input
        defaultChecked={defaultChecked}
        ref={inputRef}
        value={value}
        type="checkbox"
        id={fieldName}
        {...rest}
      />
      <StyledCheckbox checked={checked} ref={inputRef}>
        <img alt="tick icon" style={{ width: "15px" }} src={CheckIcon} />
      </StyledCheckbox>
      <label htmlFor={fieldName} key={fieldName}>
        {label}
      </label>

      {error && <span>{error}</span>}
    </Container>
  );
}
