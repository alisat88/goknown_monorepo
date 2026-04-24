import styled from "styled-components";

import { device } from "../../styles/devices";

export const Container = styled.div`
  position: fixed;
  right: 0;

  top: 0;
  padding: 30px;
  overflow: hidden;
  z-index: 9999;

  @media ${device.mobileL} {
    padding: 0;
    left: 0;
  }
`;
