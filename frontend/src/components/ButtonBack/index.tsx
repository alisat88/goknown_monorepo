import React, { useCallback, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";

import useWindowDimensions from "../../hooks/windowDimensions";
import { size } from "../../styles/devices";
import Field from "../Field";
import { Container } from "./styles";

interface IButtonProps {
  title?: string;
  goTo?: string;
  mobileTitle?: string;
  loading?: boolean;
}

const ButtonBack: React.FC<React.PropsWithChildren<IButtonProps>> = ({
  mobileTitle = "Page Title",
  goTo,
  title,
  loading = false,
}) => {
  const { goBack, go, push } = useHistory();
  const { width } = useWindowDimensions();
  const [mobile, setMobile] = useState(false);

  const formatedTitle = useMemo(() => {
    if (title) {
      return title;
    }
    const laptopM = Number(size.laptopM.replace("px", ""));
    setMobile(width <= laptopM);
    return width >= laptopM ? "Back" : mobileTitle;
  }, [mobileTitle, title, width]);

  return (
    <Container>
      <Link
        to=" "
        onClick={(e) => {
          e.preventDefault();
          // console.log(goTo);
          goTo ? push(goTo) : goBack();
        }}
      >
        <FiArrowLeft />
        {mobile ? (
          <Field
            loading={loading}
            tag="span"
            value={formatedTitle}
            width={100}
          />
        ) : (
          <span>{formatedTitle}</span>
        )}
      </Link>
    </Container>
  );
};

export default ButtonBack;
