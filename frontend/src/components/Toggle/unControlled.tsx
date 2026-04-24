import { motion } from "framer-motion";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { IconBaseProps } from "react-icons";
import { FiAlertCircle } from "react-icons/fi";

import { useField } from "@unform/core";

// import { Container, Error } from "./styles";

import "./styles.css";
import { Container, Label, Switch } from "./styles";

interface IToggleProps {
  name: string;
  inactive?: string;
  active?: string;
  isOn?: boolean;
  label?: string;
  showAlias?: boolean;
  disabled?: boolean;
  style?: any;
  onClick?(): any;
}

const Toggle: React.FC<React.PropsWithChildren<IToggleProps>> = ({
  name,
  isOn,
  label,
  active,
  inactive,
  showAlias,
  onClick,
  style,
  disabled = true,
  ...rest
}) => {
  const inputRef = useRef(null);
  const [on, setOn] = useState<boolean | string>(inactive || false);
  const [className, setClassName] = useState(`switch ${isOn ? "on" : "off"}`);

  useMemo(() => {
    setOn(inactive || isOn || false);
    setClassName(`switch ${active || isOn ? "on" : "off"}`);
  }, [active, inactive, isOn]);

  useEffect(() => {
    if (!!inactive && !!active) {
      setClassName(`switch ${active === on ? "on" : "off"}`);
    } else {
      setClassName(`switch ${on ? "on" : "off"}`);
    }
  }, [active, inactive, on]);

  const toggle = useCallback(() => {
    if (!!inactive && !!active) {
      setOn(on !== active ? active : inactive);
    } else {
      setOn(!on);
    }
    if (onClick) {
      onClick();
    }
  }, [active, inactive, on, onClick]);

  // const className = `switch ${on ? "on" : "off"}`;
  const spring = {
    type: "spring",
    stiffness: 700,
    damping: 30,
  };
  // useEffect(() => {
  //   registerField({
  //     name: fieldName,
  //     ref: inputRef.current,
  //     getValue: (ref) => on,
  //     setValue: (ref, value) => {
  //       if (!!inactive && !!active) {
  //         ref.checked = on !== active ? inactive : active;
  //       } else {
  //         ref.checked = Boolean(!on);
  //       }
  //     },
  //     clearValue: (ref) => {
  //       ref.checked = inactive || false;
  //     },
  //   });
  // }, [active, fieldName, inactive, on, registerField]);
  return (
    <Container
      hasAlias={showAlias && (!!active || !!inactive)}
      style={style}
      disabled={disabled}
    >
      {label && <Label>{label}</Label>}

      <Switch>
        {showAlias && !!inactive && (
          <Label disabled={disabled}>{inactive}</Label>
        )}

        <motion.div
          animate
          className={className}
          {...rest}
          onClick={() => !disabled && toggle()}
        >
          <motion.div animate layout transition={spring} />
        </motion.div>
        {showAlias && !!active && <Label>{active}</Label>}
      </Switch>
    </Container>
  );
};

export default Toggle;
