import styled, { css } from "styled-components";

interface IContainerProps {
  isLoading: boolean;
}

export const Container = styled.div<IContainerProps>`
  display: flex;
  align-items: center;
  width: auto;
  height: auto;
  position: relative;

  img {
    /* transition: filter ease-in 0.5s;
      filter: ${(props) => (props.isLoading ? "blur(2px)" : "blur(0px)")} */
  }
`;

interface ILoadingContentProps {
  isLoading: boolean;
}
export const LoadingContent = styled.aside<ILoadingContentProps>`
  height: 100%;
  position: absolute;
  width: 100%;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  opacity: ${(props) => (props.isLoading ? "1" : "0")};
  transition: opacity ease-in 0.5s;

  ${(props) =>
    !props.isLoading &&
    css`
      visibility: hidden;
    `}
  svg {
    color: red;
  }
`;
