import React, { useEffect } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiXCircle,
} from "react-icons/fi";

import { IToastMessage, useToast } from "../../../hooks/toast";
import { Container } from "./styles";

interface IToastProps {
  message: IToastMessage;
  style: any;
}

const icons = {
  info: <FiInfo size={24} />,
  error: <FiAlertCircle size={24} />,
  success: <FiCheckCircle size={24} />,
};

const Toast: React.FC<React.PropsWithChildren<IToastProps>> = ({
  message,
  style,
}) => {
  const { removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(message.id);
    }, message.timeout || 5000);

    // if return a function straight on the useEffect it is executed if the component dies
    return () => {
      clearTimeout(timer);
    };
  }, [message.id, message.timeout, removeToast]);

  return (
    <Container
      type={message.type}
      hasDescription={Number(!!message.description)}
      style={style}
    >
      {icons[message.type || "info"]}
      <div>
        <strong>{message.title}</strong>
        <p>{message.description}</p>
        <button type="button" onClick={() => removeToast(message.id)}>
          <FiXCircle size={18} />
        </button>
      </div>
    </Container>
  );
};

export default Toast;
