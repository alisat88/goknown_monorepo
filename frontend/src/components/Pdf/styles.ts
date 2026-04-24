import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 400px;
  max-height: 600px;
  overflow: auto;
  position: relative;

  canvas {
    max-width: 940px;
    width: 100%;
  }
`;

export const ContentButton = styled.div`
  position: absolute;
  display: flex;
  padding: 20px;
  top: 0;
  right: 0;
  > button {
    margin: 0 15px 0 0;
  }

  button {
    width: 50px;
    svg {
      background: none;
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }
  }
`;
