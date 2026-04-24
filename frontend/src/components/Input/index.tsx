import React, {
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
  useCallback,
  Fragment,
} from "react";
import { IconBaseProps } from "react-icons";
import { FiAlertCircle, FiInfo, FiMessageCircle } from "react-icons/fi";

import { useField } from "@unform/core";

import { Container, Error, Info, Label, Wrapper } from "./styles";

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  containerStyle?: any;
  isLoading?: boolean;
  isDisabled?: boolean;
  icon?: React.ComponentType<React.PropsWithChildren<IconBaseProps>>;
  information?: string;
}

const Input: React.FC<React.PropsWithChildren<IInputProps>> = ({
  name,
  label,
  icon: Icon,
  containerStyle,
  isLoading,
  isDisabled,
  information,
  ...rest
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const { fieldName, defaultValue, error, registerField } = useField(name);

  const handleInputFocus = useCallback((event: any) => {
    setIsFocused(true);
    event.target.setAttribute("autocomplete", "off");
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    setIsFilled(!!inputRef.current?.value);
  }, []);

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: inputRef.current,
      path: "value",
    });
  }, [fieldName, registerField]);

  return (
    <Wrapper>
      {label && <Label>{label}</Label>}

      <Container
        style={containerStyle}
        isErrored={!!error}
        isFocused={isFocused}
        isFilled={isFilled}
        isLoading={isLoading}
        isDisabled={isDisabled}
      >
        {Icon && <Icon size={20} />}
        <input
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          defaultValue={defaultValue}
          ref={inputRef}
          disabled={isLoading || isDisabled}
          autoComplete={`new-${fieldName}`}
          {...rest}
        />

        {error && (
          <Error title={error}>
            <FiAlertCircle color="#c53030" size={20} />
          </Error>
        )}

        {!error && information && (
          <Info title={information}>
            <FiInfo color="#00007d" size={20} />
          </Info>
        )}
      </Container>
    </Wrapper>
  );
};

export default Input;
