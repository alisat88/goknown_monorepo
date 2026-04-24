import React, { useCallback, useState, useEffect } from "react";
import { FiPlus, FiSave } from "react-icons/fi";
import { BounceLoader } from "react-spinners";

import { Container, Content } from "./styles";

interface IBUttonTransformProps {
  isLoading?: boolean;
  isDisabled?: boolean;
  hasValueToSubmit?: boolean;
  onChangePanel?(isOpen: boolean): void;
  onSubmit?(setExpand: any): void;
}

const ButtonTransform: React.FC<
  React.PropsWithChildren<IBUttonTransformProps>
> = ({
  children,
  isLoading,
  hasValueToSubmit = false,
  isDisabled = false,
  onChangePanel = () => {},
  onSubmit = () => {},
}) => {
  const [_expand, setExpand] = useState(false);

  const handleExpand = useCallback(() => {
    if (!hasValueToSubmit) {
      setExpand(!_expand);
      onChangePanel(!_expand);
      return;
    }
    onSubmit(setExpand);
  }, [_expand, hasValueToSubmit, onChangePanel, onSubmit]);

  return (
    <Container
      isExpanded={_expand}
      hasValueToSubmit={hasValueToSubmit}
      isDisabled={isDisabled}
    >
      <span onClick={handleExpand}>
        {!hasValueToSubmit ? (
          <FiPlus />
        ) : isLoading ? (
          <BounceLoader size={32} color={"#bebebe"} />
        ) : (
          <FiSave />
        )}
      </span>

      <Content isExpanded={_expand}>
        <header></header>
        <div>{children}</div>
      </Content>
    </Container>
  );
};

export default ButtonTransform;
