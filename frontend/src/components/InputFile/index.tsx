import React, {
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
  useCallback,
  AnchorHTMLAttributes,
  ChangeEvent,
} from "react";
import { IconBaseProps } from "react-icons";
import { FiAlertCircle } from "react-icons/fi";

import { useField } from "@unform/core";

import { Container, Error } from "./styles";

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  containerStyle?: any;
  isLoading?: boolean;
  icon?: React.ComponentType<React.PropsWithChildren<IconBaseProps>>;
}

const InputFile: React.FC<React.PropsWithChildren<IInputProps>> = ({
  name,
  icon: Icon,
  containerStyle,
  isLoading,
  ...rest
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const { fieldName, defaultValue, error, registerField, clearError } =
    useField(name);
  const [preview, setPreview] = useState(defaultValue);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    setIsFilled(!!inputRef.current?.value);
  }, []);

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: inputRef.current,
      path: "files[0]",
      clearValue(ref: HTMLInputElement) {
        ref.value = "";
        setPreview(null);
      },
      setValue(_: HTMLInputElement, value: string) {
        setPreview(value);
      },
    });
  }, [fieldName, registerField]);

  const handlePreview = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
    } else {
      const previewURL = URL.createObjectURL(file);
      setPreview(previewURL);
    }
  }, []);

  const handleRemoveFile = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (inputRef.current?.files) {
      setHasFile(false);
      inputRef.current.value = "";
      inputRef.current.files = null;
    }
  }, []);

  return (
    <Container
      style={containerStyle}
      isErrored={!!error}
      isFocused={isFocused}
      isFilled={isFilled}
      isLoading={isLoading}
    >
      {Icon && <Icon size={20} />}
      <input
        type="file"
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onChange={() => {
          setHasFile(true);
          clearError();
        }}
        // defaultValue={defaultValue}
        ref={inputRef}
        disabled={isLoading}
        {...rest}
      />

      {hasFile ? (
        <>
          <strong>
            {inputRef.current?.files ? inputRef.current?.files[0].name : null}
          </strong>
          <a
            href="#"
            onClick={(e: React.MouseEvent<HTMLElement>) => handleRemoveFile(e)}
          >
            REMOVE
          </a>
        </>
      ) : (
        <button onClick={() => inputRef.current?.click()}>
          {rest.placeholder}
        </button>
      )}

      {error && (
        <Error title={error}>
          <FiAlertCircle color="#c53030" size={20} />
        </Error>
      )}
    </Container>
  );
};

export default InputFile;
