import React, {
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { IconBaseProps } from "react-icons";
import { FiAlertCircle } from "react-icons/fi";

import { useField } from "@unform/core";

import { Container, Error, Label, Wrapper } from "./styles";

interface ITextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  containerStyle?: any;
  isLoading?: boolean;
  icon?: React.ComponentType<React.PropsWithChildren<IconBaseProps>>;
}

const TextArea: React.FC<React.PropsWithChildren<ITextAreaProps>> = ({
  name,
  label,
  icon: Icon,
  containerStyle,
  isLoading,
  ...rest
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const { fieldName, defaultValue, error, registerField } = useField(name);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    setIsFilled(!!textAreaRef.current?.value);
  }, []);

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: textAreaRef.current,
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
      >
        {Icon && <Icon size={20} />}
        <textarea
          type="textarea"
          rows={5}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          defaultValue={defaultValue}
          ref={textAreaRef}
          disabled={isLoading}
          {...rest}
        />

        {error && (
          <Error title={error}>
            <FiAlertCircle color="#c53030" size={20} />
          </Error>
        )}
      </Container>
    </Wrapper>
  );
};

export default TextArea;
