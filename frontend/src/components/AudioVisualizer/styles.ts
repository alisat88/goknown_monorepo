import { isIOS } from "react-device-detect";
import styled, { css } from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
  width: 100%;
  height: 100%;

  margin-bottom: 40px;
  ${(props) =>
    isIOS &&
    css`
      height: 25vh !important;
      margin-bottom: 0px;
    `}

  img {
    position: absolute;
  }

  canvas {
    width: 100%;
    height: 30vh !important;
  }

  audio {
    position: absolute;
    top: 90%;
    width: 90%;
    ${(props) =>
      isIOS &&
      css`
        top: 60%;
        z-index: 3 !important;
      `}
  }
`;
